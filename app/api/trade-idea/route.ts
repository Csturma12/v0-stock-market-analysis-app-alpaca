import { generateText, Output } from "ai"
import { z } from "zod"
import { polygon } from "@/lib/polygon"
import { finnhub } from "@/lib/finnhub"
import { tavily } from "@/lib/tavily"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

const TradeIdeaSchema = z.object({
  thesis: z.string().describe("2-3 sentence trade thesis"),
  direction: z.enum(["long", "short", "neutral"]),
  conviction: z.number().min(1).max(10).describe("Conviction score 1-10"),
  entry: z.number().describe("Suggested entry price"),
  stopLoss: z.number().describe("Stop loss price"),
  target: z.number().describe("Price target"),
  timeframe: z.enum(["intraday", "swing", "position"]),
  risks: z.array(z.string()).describe("Top 3 risks to this trade"),
  catalysts: z.array(z.string()).describe("Top 3 upcoming catalysts"),
  keyMetrics: z.array(z.object({ label: z.string(), value: z.string() })).describe("4-6 key metrics driving the idea"),
})

export async function POST(req: Request) {
  const { symbol } = await req.json()
  const sym = String(symbol).toUpperCase()

  // Gather all context in parallel
  const [snapshot, profile, metrics, candles, recs, webResults, news, pastIdeas] = await Promise.all([
    polygon.snapshot(sym).catch(() => null),
    finnhub.profile(sym).catch(() => null),
    finnhub.basicFinancials(sym).catch(() => null),
    polygon.aggregates(sym, 30).catch(() => []),
    finnhub.recommendations(sym).catch(() => []),
    tavily
      .search(
        `${sym} stock analysis news ${new Date().toLocaleDateString()} catalysts earnings analyst rating geopolitical`,
        5,
      )
      .catch(() => null),
    finnhub.companyNews(sym, 14).catch(() => []),
    getPastIdeas(sym).catch(() => []),
  ])

  const recentCloses = candles.slice(-20).map((c) => c.c)
  const change20 = recentCloses.length > 1 ? (recentCloses.at(-1)! / recentCloses[0] - 1) * 100 : 0

  const context = `
TICKER: ${sym} — ${profile?.name ?? ""}
Exchange: ${profile?.exchange ?? "—"} | Industry: ${profile?.finnhubIndustry ?? "—"}
Price: $${snapshot?.price ?? "—"} | Day: ${snapshot?.changePct?.toFixed(2) ?? "—"}% | 20d: ${change20.toFixed(2)}%

KEY FUNDAMENTALS:
${JSON.stringify(
  {
    peTTM: metrics?.metric?.peTTM,
    psTTM: metrics?.metric?.psTTM,
    revGrowth: metrics?.metric?.revenueGrowthTTMYoy,
    epsGrowth: metrics?.metric?.epsGrowthTTMYoy,
    netMargin: metrics?.metric?.netProfitMarginTTM,
    roe: metrics?.metric?.roeTTM,
    debtEquity: metrics?.metric?.["totalDebt/totalEquityAnnual"],
    beta: metrics?.metric?.beta,
    hi52: metrics?.metric?.["52WeekHigh"],
    lo52: metrics?.metric?.["52WeekLow"],
  },
  null,
  2,
)}

ANALYST CONSENSUS (latest):
${JSON.stringify(recs[0] ?? {}, null, 2)}

RECENT HEADLINES (Finnhub):
${news.slice(0, 10).map((n: any) => `- ${n.headline} (${n.source})`).join("\n")}

WEB SEARCH (Tavily):
${webResults?.answer ?? ""}
${(webResults?.results ?? []).slice(0, 5).map((r: any) => `- ${r.title}: ${r.content?.slice(0, 200)}`).join("\n")}

PAST TRADE IDEAS ON THIS TICKER (for learning — avoid repeating mistakes):
${pastIdeas.map((p: any) => `- ${p.created_at}: ${p.direction} @ ${p.entry} → outcome: ${p.outcome ?? "open"} (${p.pnl_pct ?? "—"}%). Thesis: ${p.thesis?.slice(0, 150)}`).join("\n") || "(no prior ideas)"}
`.trim()

  try {
    const { experimental_output } = await generateText({
      model: "anthropic/claude-opus-4.6",
      system: `You are a disciplined equity analyst. Generate a concrete, actionable trade idea.
Be honest about risk. If data is insufficient or the setup is poor, set conviction to 1-3 and direction to "neutral".
Entry/stop/target must be real price levels near the current price. Use 1R:2R minimum reward-to-risk for longs/shorts.`,
      prompt: context,
      experimental_output: Output.object({ schema: TradeIdeaSchema }),
    })

    const idea = experimental_output

    // Persist to learning memory
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
      context_snapshot: context,
    })
  } catch (e) {
    console.error("[v0] persist idea failed:", e)
  }
}
