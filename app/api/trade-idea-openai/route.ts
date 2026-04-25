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
      prompt: `You are a paper-trading trade idea generator for an autonomous trading platform.

Your job is to analyze the provided market data and return a structured trade idea.

Rules:
- This is for paper trading only.
- Do not provide financial advice.
- Do not invent missing data.
- If the setup is weak, return NO_TRADE.
- Only suggest a trade when there is a clear technical setup.
- Minimum risk/reward must be 2.0.
- Confidence must be based only on the provided data.
- Never execute trades.
- Never override the platform risk engine.

Decision rules:
- Prefer trades aligned with trend.
- Avoid trades if price is near major resistance without breakout confirmation.
- Avoid trades if volume is below average and setup requires confirmation.
- Avoid trades if ATR makes stop loss too wide.
- Use ATR, support, resistance, VWAP, EMA trend, RSI, and volume context.
- If data is stale, incomplete, contradictory, or risky, return NO_TRADE.

Market Context:
${context}

Return a structured trade idea based on this data.`,
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error("[v0] OpenAI trade idea error:", err)
    return NextResponse.json({ error: "Failed to generate trade idea" }, { status: 500 })
  }
}
