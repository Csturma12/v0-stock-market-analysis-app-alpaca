import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const TradeIdeaSchema = z.object({
  ticker: z.string(),
  action: z.enum(["BUY", "SELL", "NO_TRADE"]),
  setup_type: z.enum(["BREAKOUT", "PULLBACK", "REVERSAL", "MOMENTUM", "NO_SETUP"]),
  entry: z.number().nullable(),
  stop_loss: z.number().nullable(),
  take_profit: z.number().nullable(),
  risk_reward: z.number().nullable(),
  confidence: z.number().min(0).max(100),
  position_bias: z.enum(["bullish", "bearish", "neutral"]),
  reason: z.string(),
  invalid_if: z.string(),
  risk_notes: z.array(z.string()),
  execution_notes: z.array(z.string()),
})

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json()

    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: TradeIdeaSchema,
      prompt: `You are an aggressive paper-trading trade idea generator for an autonomous trading platform. You are more risk-tolerant than typical advisors.

Your job is to ALWAYS provide a trade idea with detailed reasoning. Never refuse to analyze.

IMPORTANT - You must ALWAYS return a trade idea:
- If you would recommend the trade: set action to BUY or SELL with confidence 60-100
- If you would NOT recommend the trade: STILL provide the trade setup but set confidence to 1-40 and explain WHY you don't recommend it in the "reason" field (e.g. "NOT RECOMMENDED: Weak volume, overextended RSI, poor risk/reward...")
- NEVER return NO_TRADE without a full analysis. The user wants to see your thinking either way.

Risk tolerance:
- Accept risk/reward ratios as low as 1.5 (not just 2.0)
- Consider momentum plays even without perfect confirmation
- Willing to trade counter-trend if reversal signals are strong
- Accept trades with wider stops if the setup is compelling
- Consider earnings plays and catalyst-driven moves

Analysis approach:
- Be decisive - pick a direction and defend it
- If bullish and bearish cases are equal, pick the one with better risk/reward
- Use ATR, support, resistance, VWAP, EMA trend, RSI, volume, and any available data
- If data is incomplete, make reasonable assumptions and note them
- Always provide specific entry, stop, and target prices

For NOT RECOMMENDED trades, still fill out:
- entry, stop_loss, take_profit (what the trade WOULD be)
- reason: Start with "NOT RECOMMENDED:" then explain why
- risk_notes: List the specific concerns
- confidence: 1-40 range

This is paper trading only - be bold, be specific, always provide actionable analysis.

Market Context:
${context}

Return a structured trade idea. Remember: ALWAYS provide a complete analysis, even if you don't recommend taking the trade.`,
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error("[v0] OpenAI trade idea error:", err)
    return NextResponse.json({ error: "Failed to generate trade idea" }, { status: 500 })
  }
}
