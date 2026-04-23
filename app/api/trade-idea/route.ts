import { generateText, Output } from "ai"
import { z } from "zod"
import { getSnapshot, getAggregates } from "@/lib/polygon"
import { getCompanyProfile, getBasicFinancials, getRecommendationTrends, getCompanyNews } from "@/lib/finnhub"
import { tavilySearch } from "@/lib/tavily"
import { getUnusualWhalesSummary } from "@/lib/unusual-whales"
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

  const [snapshot, profile, metrics, candles, recs, web, news, uw, pastIdeas] = await Promise.all([
    getSnapshot(sym),
    getCompanyProfile(sym),
    getBasicFinancials(sym),
    getAggregates(sym, 30),
    getRecommendationTrends(sym),
    tavilySearch(
      `${sym} stock analysis ${new Date().toLocaleDateString()} catalysts earnings analyst rating merger acquisition geopolitical`,
      { topic: "news", maxResults: 6, days: 14 },
    ),
    getCompanyNews(sym, 14),
    getUnusualWhalesSummary(sym),
    getPastIdeas(sym),
  ])

  const recentCloses = candles.slice(-20).map((c) => c.close)
  const change20 = recentCloses.length > 1 ? (recentCloses.at(-1)! / recentCloses[0] - 1) * 100 : 0

  const context = `
TICKER: ${sym} — ${profile?.name ?? ""}
Exchange: ${profile?.exchange ?? "—"} | Industry: ${profile?.industry ?? "—"}
Price: $${snapshot?.price ?? "—"} | Day: ${snapshot?.changePct?.toFixed(2) ?? "—"}% | 20d: ${change20.toFixed(2)}%

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

PAST TRADE IDEAS ON THIS TICKER (for learning — avoid repeating mistakes):
${pastIdeas.map((p: any) => `- ${p.created_at}: ${p.direction} @ ${p.entry} → outcome: ${p.outcome ?? "open"} (${p.pnl_pct ?? "—"}%). Thesis: ${p.thesis?.slice(0, 150)}`).join("\n") || "(no prior ideas)"}
`.trim()

  try {
    const { experimental_output } = await generateText({
      model: "anthropic/claude-opus-4.6",
      system: `You are a disciplined equity analyst who weights institutional flow heavily.
Generate a concrete, actionable trade idea.
Explicitly factor in dark pool bias and unusual options flow — they reveal what smart money is doing.
When dark pool and options flow disagree with retail sentiment or price action, flag it.
Be honest about risk. If data is insufficient or the setup is poor, set conviction to 1-3 and direction to "neutral".
Entry/stop/target must be real price levels near the current price. Use 1R:2R minimum reward-to-risk for longs/shorts.`,
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
      context_snapshot: context,
    })
  } catch (e) {
    console.error("[v0] persist idea failed:", e)
  }
}
