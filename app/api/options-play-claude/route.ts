import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

const OptionsPlaySchema = z.object({
  ticker: z.string(),
  strategy: z.enum(["CALL_SPREAD", "PUT_SPREAD", "IRON_CONDOR", "STRANGLE", "BUTTERFLY", "NO_PLAY"]),
  expiry: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  long_strike: z.number().nullable(),
  short_strike: z.number().nullable(),
  max_profit: z.number().nullable(),
  max_loss: z.number().nullable(),
  breakeven: z.number().nullable(),
  probability_of_profit: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  bias: z.enum(["bullish", "bearish", "neutral"]),
  reason: z.string(),
  risk_notes: z.array(z.string()),
})

export async function POST(req: NextRequest) {
  try {
    const { context, expiry = "WEEKLY" } = await req.json()

    const { object } = await generateObject({
      model: "anthropic/claude-sonnet-4-20250514",
      schema: OptionsPlaySchema,
      prompt: `You are an analytical options strategist for a paper trading platform.

ALWAYS provide an options play analysis. Even if you don't recommend it, fill out all fields with what the trade WOULD be, then explain concerns in the reason field.

Based on the provided market data, generate a structured options play (${expiry} expiry preferred).

Guidelines:
- Paper trading only — educational and analysis purposes
- Be thorough and analytical in your reasoning
- Consider volatility skew, term structure, and Greeks
- For weak setups: still provide strikes and metrics, but set confidence low (10-40) and explain why in reason
- Prefer defined-risk strategies (spreads, iron condors)
- Consider theta decay relative to expected move timeframe
- Use IV percentile/rank if available to determine if options are cheap or expensive

Strategy selection:
- CALL_SPREAD: Bullish with limited risk, good when IV is elevated
- PUT_SPREAD: Bearish with limited risk, good when IV is elevated  
- IRON_CONDOR: Neutral, expecting range-bound action, high IV environment
- STRANGLE: Expecting big move either direction, low IV environment
- BUTTERFLY: Pinning to a specific price target, lower cost

Market Context:
${context}

Return a complete options play with specific strikes, max P&L projections, and probability metrics. Remember: ALWAYS provide full analysis.`,
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error("[v0] Claude options play error:", err)
    return NextResponse.json({ error: "Failed to generate options play" }, { status: 500 })
  }
}
