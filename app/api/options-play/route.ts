import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const OptionsPlaySchema = z.object({
  ticker: z.string(),
  strategy: z.enum(["CALL_SPREAD", "PUT_SPREAD", "IRON_CONDOR", "STRANGLE", "BUTTERFLY", "NO_PLAY"]),
  expiry: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
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
      model: openai("gpt-4-turbo"),
      schema: OptionsPlaySchema,
      prompt: `You are an options play generator for an autonomous trading platform analyzing paper trading opportunities.

Based on the provided market data, generate a structured options play (${expiry} expiry preferred). If the stock has ${expiry} options available, prioritize them; otherwise suggest the closest available expiry.

Rules:
- Paper trading only — educational and analysis purposes.
- No financial advice.
- If setup is weak or doesn't warrant an options play, return NO_PLAY.
- Minimum probability of profit should be 55%+.
- Max loss should be defined and acceptable (typically 2-5% of account).
- Use IV, theta decay, and underlying momentum context.

Market Context:
${context}

Return a structured options play with clear strikes, max P&L, and probability metrics.`,
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error("[v0] OpenAI options play error:", err)
    return NextResponse.json({ error: "Failed to generate options play" }, { status: 500 })
  }
}
