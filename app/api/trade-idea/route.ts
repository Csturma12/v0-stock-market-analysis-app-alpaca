import { generateText, Output } from "ai"
import { z } from "zod"
import { getSnapshot, getAggregates } from "@/lib/polygon"
import {
  getOptionChainSnapshot,
  listOptionContracts,
  summarizeChainForLLM,
  realizedVol,
} from "@/lib/polygon-options"
import { getCompanyProfile, getBasicFinancials, getRecommendationTrends, getCompanyNews } from "@/lib/finnhub"
import { tavilySearch } from "@/lib/tavily"
import { getUnusualWhalesSummary } from "@/lib/unusual-whales"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

const LegSchema = z.object({
  action: z.enum(["buy", "sell"]).describe("buy = long, sell = short / write"),
  instrument: z.enum(["stock", "call", "put"]),
  strike: z.number().nullable().optional().describe("Required for calls/puts. Null for stock legs."),
  expiry: z.string().nullable().optional().describe("YYYY-MM-DD. Required for options legs."),
  qty: z.number().describe("Shares for stock legs. Contracts for options (1 contract = 100 shares)."),
  limitPrice: z.number().nullable().optional().describe("Suggested limit price per share / per contract mid."),
})

const PlaySchema = z.object({
  role: z.enum(["primary", "hedge"]).describe("primary = the main trade. hedge = risk overlay."),
  strategy: z
    .enum([
      "long_stock",
      "short_stock",
      "long_call",
      "long_put",
      "stock_plus_long_call",
      "stock_plus_long_put",
      "protective_put",
      "covered_call",
      "collar",
      "call_spread",
      "put_spread",
    ])
    .describe("Concrete structure."),
  thesis: z.string().describe("1-2 sentences on why this structure fits the setup."),
  legs: z.array(LegSchema).min(1).max(4),
  maxLoss: z.string().describe("Dollar or % max loss, e.g. '$450 per contract' or '8% of notional'"),
  maxGain: z.string().describe("Dollar, % or 'uncapped'"),
  breakeven: z.string().describe("Breakeven price(s) at expiration"),
  netDebitCredit: z
    .number()
    .nullable()
    .optional()
    .describe("Positive = net debit paid. Negative = net credit received. Per full position."),
})

const TradeIdeaSchema = z.object({
  thesis: z.string().describe("2-3 sentence trade thesis"),
  direction: z.enum(["long", "short", "neutral"]),
  conviction: z.number().min(1).max(10).describe("Conviction score 1-10"),
  entry: z.number().describe("Suggested entry price (stock level)"),
  stopLoss: z.number().describe("Stop loss price"),
  target: z.number().describe("Price target"),
  timeframe: z.enum(["intraday", "swing", "position"]),
  risks: z.array(z.string()).describe("Top 3 risks to this trade"),
  catalysts: z.array(z.string()).describe("Top 3 upcoming catalysts"),
  keyMetrics: z.array(z.object({ label: z.string(), value: z.string() })).describe("4-6 key metrics driving the idea"),
  plays: z
    .array(PlaySchema)
    .min(1)
    .max(3)
    .describe(
      "Concrete structures. ALWAYS include at least one primary play. When the primary thesis is risky (swing trade, speculative long call/put, or event-driven), you MUST include a hedge play when practical. For low-risk income setups (like covered calls on existing longs) a hedge is optional.",
    ),
})

export async function POST(req: Request) {
  const { symbol } = await req.json()
  const sym = String(symbol).toUpperCase()

  const [snapshot, profile, metrics, candles, recs, web, news, uw, pastIdeas] = await Promise.all([
    getSnapshot(sym),
    getCompanyProfile(sym),
    getBasicFinancials(sym),
    getAggregates(sym, 60),
    getRecommendationTrends(sym),
    tavilySearch(
      `${sym} stock analysis ${new Date().toLocaleDateString()} catalysts earnings analyst rating merger acquisition geopolitical`,
      { topic: "news", maxResults: 6, days: 14 },
    ),
    getCompanyNews(sym, 14),
    getUnusualWhalesSummary(sym),
    getPastIdeas(sym),
  ])

  const spot = snapshot?.price ?? 0
  const recentCloses = candles.slice(-20).map((c) => c.close)
  const change20 = recentCloses.length > 1 ? (recentCloses.at(-1)! / recentCloses[0] - 1) * 100 : 0
  const rv30 = realizedVol(candles.slice(-30).map((c) => c.close))

  // Options chain: try full snapshot (paid), fall back to contract reference + empty greeks.
  const todayISO = new Date().toISOString().slice(0, 10)
  const threeMonthsOut = new Date(Date.now() + 100 * 86_400_000).toISOString().slice(0, 10)

  let chain = await getOptionChainSnapshot(sym)
  if (chain.length === 0) {
    const refs = await listOptionContracts(sym, {
      expirationDateGte: todayISO,
      expirationDateLte: threeMonthsOut,
      limit: 250,
    })
    // Map refs to chain shape with null greeks.
    chain = refs.map((c) => ({ ...c, last: null, bid: null, ask: null, mid: null, volume: null, openInterest: null, iv: null, delta: null, gamma: null, theta: null, vega: null }))
  }
  const chainSummary = chain.length > 0 && spot > 0 ? summarizeChainForLLM(chain, spot, 3) : "(no options chain)"

  const context = `
TICKER: ${sym} — ${profile?.name ?? ""}
Exchange: ${profile?.exchange ?? "—"} | Industry: ${profile?.industry ?? "—"}
Price: $${spot} | Day: ${snapshot?.changePct?.toFixed(2) ?? "—"}% | 20d: ${change20.toFixed(2)}%
30d realized vol (annualized): ${(rv30 * 100).toFixed(1)}%

KEY FUNDAMENTALS:
${JSON.stringify(
  {
    peTTM: metrics?.peTTM,
    psTTM: metrics?.psTTM,
    revGrowth: metrics?.revenueGrowthTTMYoy,
    epsGrowth: metrics?.epsGrowthTTMYoy,
    netMargin: metrics?.netProfitMarginTTM,
    roe: metrics?.roeTTM,
    debtEquity: metrics?.["totalDebt/totalEquityAnnual"],
    beta: metrics?.beta,
    hi52: metrics?.["52WeekHigh"],
    lo52: metrics?.["52WeekLow"],
  },
  null,
  2,
)}

ANALYST CONSENSUS (latest):
${JSON.stringify(recs[0] ?? {}, null, 2)}

RECENT HEADLINES (Finnhub):
${news.slice(0, 10).map((n) => `- ${n.headline} (${n.source})`).join("\n")}

WEB SEARCH (Tavily):
${web.answer ?? ""}
${web.results.slice(0, 5).map((r) => `- ${r.title}: ${r.content?.slice(0, 200)}`).join("\n")}

INSTITUTIONAL FLOW — DARK POOL (Unusual Whales, last ${uw?.darkPool.prints.length ?? 0} prints):
${
  uw
    ? `Total dark pool size: ${uw.darkPool.totalSize.toLocaleString()} shares
Total dark pool premium: $${uw.darkPool.totalPremium.toLocaleString()}
Largest print: ${
        uw.darkPool.largestPrint
          ? `${uw.darkPool.largestPrint.size.toLocaleString()} shares @ $${uw.darkPool.largestPrint.price} ($${uw.darkPool.largestPrint.premium.toLocaleString()})`
          : "—"
      }`
    : "(no dark pool data)"
}

OPTIONS FLOW (Unusual Whales — ${uw?.flow.alerts.length ?? 0} significant trades):
${
  uw && uw.flow.alerts.length > 0
    ? `Call premium: $${uw.flow.callPremium.toLocaleString()} | Put premium: $${uw.flow.putPremium.toLocaleString()}
Call/Put premium ratio: ${uw.flow.callPutRatio === Number.POSITIVE_INFINITY ? "∞ (calls only)" : uw.flow.callPutRatio.toFixed(2)}
Bullish alerts: ${uw.flow.bullishCount} | Bearish alerts: ${uw.flow.bearishCount}

Top alerts:
${uw.flow.alerts
  .slice(0, 8)
  .map(
    (t) =>
      `- ${t.sentiment.toUpperCase()} ${t.type.toUpperCase()} $${t.strike} ${t.expiry} | side: ${t.side} | size: ${t.volume} | OI: ${t.openInterest} | premium: $${t.premium.toLocaleString()}`,
  )
  .join("\n")}`
    : "(no unusual options flow)"
}

GREEK EXPOSURE (dealer positioning):
${
  uw?.greekExposure
    ? `Call gamma: ${uw.greekExposure.callGamma ?? "—"} | Put gamma: ${uw.greekExposure.putGamma ?? "—"}
Call delta: ${uw.greekExposure.callDelta ?? "—"} | Put delta: ${uw.greekExposure.putDelta ?? "—"}`
    : "(no greek data)"
}

OPTIONS CHAIN — nearest 3 expiries, ATM +/- 4 strikes:
${chainSummary}

PAST TRADE IDEAS ON THIS TICKER (for learning — avoid repeating mistakes):
${pastIdeas.map((p: any) => `- ${p.created_at}: ${p.direction} @ ${p.entry} → outcome: ${p.outcome ?? "open"} (${p.pnl_pct ?? "—"}%). Thesis: ${p.thesis?.slice(0, 150)}`).join("\n") || "(no prior ideas)"}
`.trim()

  try {
    const { experimental_output } = await generateText({
      model: "anthropic/claude-opus-4.6",
      system: `You are a disciplined equity + derivatives analyst who weights institutional flow heavily.
Generate a concrete, actionable trade idea with one or more structured "plays".

PLAY SELECTION RULES:
- For high-conviction directional swings (conviction >= 7), consider long stock PLUS a long call (stock_plus_long_call) or long put (stock_plus_long_put) to juice upside with defined extra risk.
- For speculative directional bets where the user doesn't want large capital at risk, a pure long_call or long_put is appropriate. Pick strikes near ATM or slightly OTM with 30-90 DTE.
- If the primary play is a long stock position on a risky name (high beta, high RV, binary catalyst pending), ALWAYS add a hedge: protective_put (buy OTM put ~5-10% below spot) or a put_spread if IV is high.
- If the primary is a long_call or long_put, a hedge is optional but consider a vertical spread (call_spread / put_spread) to reduce cost — if you convert, make that the primary, not a separate hedge.
- If implied vol is elevated (IV > realized vol by 20%+), prefer selling premium structures (credit spreads, covered calls) over buying long options alone.
- NEVER recommend naked short calls or naked short puts. Use spreads or collars if you need negative delta or credit structures.

LEG FORMATTING:
- Stock legs: instrument="stock", qty in shares (e.g. 100), no strike/expiry.
- Option legs: instrument="call"|"put", qty in contracts (1 contract = 100 shares), strike must be a real strike on the chain, expiry in YYYY-MM-DD from the chain data above.
- Use mid prices from the chain as limitPrice when provided.

Explicitly factor in dark pool bias and unusual options flow — they reveal what smart money is doing.
When dark pool and options flow disagree with retail sentiment or price action, flag it in the risks.
Be honest about risk. If data is insufficient or the setup is poor, set conviction to 1-3 and direction to "neutral" and recommend a single low-conviction long_stock play with tight stop.
Entry/stop/target must be real price levels near the current stock price. Use 1R:2R minimum reward-to-risk for longs/shorts.`,
      prompt: context,
      experimental_output: Output.object({ schema: TradeIdeaSchema }),
    })

    const idea = experimental_output

    await persistIdea(sym, idea, context.slice(0, 8000))

    return Response.json({ idea })
  } catch (err: any) {
    console.error("[v0] trade-idea error:", err)
    return Response.json({ error: err.message ?? "AI generation failed" }, { status: 500 })
  }
}

async function getPastIdeas(symbol: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("trade_ideas")
      .select("*")
      .eq("symbol", symbol)
      .order("created_at", { ascending: false })
      .limit(5)
    return data ?? []
  } catch {
    return []
  }
}

async function persistIdea(symbol: string, idea: z.infer<typeof TradeIdeaSchema>, context: string) {
  try {
    const supabase = await createClient()
    await supabase.from("trade_ideas").insert({
      symbol,
      direction: idea.direction,
      conviction: idea.conviction,
      entry: idea.entry,
      stop_loss: idea.stopLoss,
      target: idea.target,
      timeframe: idea.timeframe,
      thesis: idea.thesis,
      risks: idea.risks,
      catalysts: idea.catalysts,
      key_metrics: idea.keyMetrics,
      // Store plays JSON in context_snapshot suffix; extend schema in a future migration if needed.
      context_snapshot: `${context}\n\n[PLAYS]\n${JSON.stringify(idea.plays, null, 2)}`,
    })
  } catch (e) {
    console.error("[v0] persist idea failed:", e)
  }
}
