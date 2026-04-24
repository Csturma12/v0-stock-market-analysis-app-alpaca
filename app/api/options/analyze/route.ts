import { generateText, Output } from "ai"
import { z } from "zod"
import { getSnapshot, getAggregates } from "@/lib/polygon"
import {
  getOptionChainSnapshot,
  listOptionContracts,
  summarizeChainForLLM,
  realizedVol,
  type OptionChainSnapshot,
} from "@/lib/polygon-options"

export const maxDuration = 45

const PlaySchema = z.object({
  title: z.string().describe("Short name, e.g. '45-DTE 5% OTM Long Call'"),
  bias: z.enum(["bullish", "bearish", "neutral", "volatility"]),
  structure: z.string().describe("e.g. 'Long 1 AAPL $185 call 2025-03-21'"),
  rationale: z.string().describe("1-2 sentences why this fits"),
  maxLoss: z.string(),
  maxGain: z.string(),
  breakeven: z.string(),
  riskLevel: z.enum(["conservative", "moderate", "aggressive"]),
})

const AnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence read on the options landscape for this ticker"),
  ivAssessment: z
    .enum(["low", "moderate", "elevated", "extremely_elevated"])
    .describe("Broad IV read vs realized vol"),
  skew: z.string().describe("Brief note on put/call skew if observable"),
  plays: z.array(PlaySchema).min(2).max(5),
})

export async function POST(req: Request) {
  const { symbol } = await req.json()
  const sym = String(symbol).toUpperCase()

  const [snapshot, candles] = await Promise.all([getSnapshot(sym), getAggregates(sym, 60)])
  const spot = snapshot?.price ?? 0
  if (!spot) {
    return Response.json({ error: `Could not fetch spot price for ${sym}` }, { status: 400 })
  }

  const rv30 = realizedVol(candles.slice(-30).map((c) => c.close))

  // Pull ~100 days of forward expiries
  const todayISO = new Date().toISOString().slice(0, 10)
  const windowEnd = new Date(Date.now() + 120 * 86_400_000).toISOString().slice(0, 10)

  let chain: OptionChainSnapshot[] = await getOptionChainSnapshot(sym)
  if (chain.length === 0) {
    const refs = await listOptionContracts(sym, {
      expirationDateGte: todayISO,
      expirationDateLte: windowEnd,
      limit: 250,
    })
    chain = refs.map((c) => ({
      ...c,
      last: null,
      bid: null,
      ask: null,
      mid: null,
      volume: null,
      openInterest: null,
      iv: null,
      delta: null,
      gamma: null,
      theta: null,
      vega: null,
    }))
  }

  const chainSummary = summarizeChainForLLM(chain, spot, 4)

  // Compact structured expiries for the response UI
  const byExpiry = new Map<string, { calls: OptionChainSnapshot[]; puts: OptionChainSnapshot[] }>()
  for (const c of chain) {
    if (!byExpiry.has(c.expiry)) byExpiry.set(c.expiry, { calls: [], puts: [] })
    const bucket = byExpiry.get(c.expiry)!
    ;(c.type === "call" ? bucket.calls : bucket.puts).push(c)
  }
  const expiries = [...byExpiry.keys()].sort().slice(0, 6).map((expiry) => {
    const bucket = byExpiry.get(expiry)!
    const dte = Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000))
    const uniqueStrikes = [...new Set(bucket.calls.map((c) => c.strike))].sort((a, b) => a - b)
    const atm = uniqueStrikes.reduce(
      (best, k) => (Math.abs(k - spot) < Math.abs(best - spot) ? k : best),
      uniqueStrikes[0] ?? spot,
    )
    return {
      expiry,
      dte,
      strikeCount: uniqueStrikes.length,
      atmStrike: atm,
      atmCall: bucket.calls.find((c) => c.strike === atm) ?? null,
      atmPut: bucket.puts.find((c) => c.strike === atm) ?? null,
    }
  })

  const context = `
TICKER: ${sym}
Spot: $${spot.toFixed(2)}
30-day realized vol (annualized): ${(rv30 * 100).toFixed(1)}%

OPTIONS CHAIN (nearest 4 expiries, ATM +/- 4 strikes):
${chainSummary}
`.trim()

  try {
    const { experimental_output } = await generateText({
      model: "anthropic/claude-opus-4.6",
      system: `You are an options strategist. Analyze the chain and propose 2-4 concrete plays.

RULES:
- Prefer 30-90 DTE for directional longs unless user has a specific event.
- If IV appears high relative to realized vol, favor selling premium (vertical credit spreads, covered calls on existing longs).
- If IV appears low vs realized vol, favor buying premium (long calls/puts, debit spreads).
- Include at least one conservative play (defined risk) and at least one more aggressive play.
- ALWAYS include exact strike and expiry pulled from the chain data provided.
- NEVER suggest naked short calls. Naked short puts are permitted only with a "conservative" risk_level label when the strike is >= 10% below spot.
- If the chain is empty or unreliable, lower the number of plays and explain in the summary.
- Be honest about skew or IV if the data isn't there to support a claim.`,
      prompt: context,
      experimental_output: Output.object({ schema: AnalysisSchema }),
    })

    return Response.json({
      symbol: sym,
      spot,
      realizedVol: rv30,
      expiries,
      analysis: experimental_output,
    })
  } catch (err: any) {
    console.error("[v0] options analyzer error:", err)
    return Response.json({ error: err.message ?? "AI generation failed" }, { status: 500 })
  }
}
