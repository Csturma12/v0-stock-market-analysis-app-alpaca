import { NextResponse } from "next/server"
import { getUnusualWhalesSummary } from "@/lib/unusual-whales"
import { getFullMetrics } from "@/lib/flashalpha"
import { getTradierFlowSummary } from "@/lib/tradier-unusual-activity"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(req.url)
  const period = (searchParams.get("period") as any) || "weekly"

  try {
    const [uw, flashAlpha, tradierFlow] = await Promise.all([
      getUnusualWhalesSummary(symbol, period),
      getFullMetrics(symbol),
      getTradierFlowSummary(symbol),
    ])
    return NextResponse.json({ uw, flashAlpha, tradierFlow })
  } catch (err) {
    console.log("[v0] flow route error", err)
    return NextResponse.json({ uw: null, flashAlpha: null, tradierFlow: null })
  }
}
