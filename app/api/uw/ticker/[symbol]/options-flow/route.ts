import { getUnusualWhalesSummary } from "@/lib/unusual-whales"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params
    const summary = await getUnusualWhalesSummary(symbol, "weekly")
    if (!summary) {
      return NextResponse.json({ alerts: [], stats: null })
    }
    const { flow } = summary
    const blocks = flow.alerts.filter((a) => a.isBlock)
    const sweeps = flow.alerts.filter((a) => a.isSweep)
    return NextResponse.json({
      alerts: flow.alerts,
      stats: {
        callPremium: flow.callPremium,
        putPremium: flow.putPremium,
        callPutRatio: flow.callPutRatio,
        bullishCount: flow.bullishCount,
        bearishCount: flow.bearishCount,
        blockCount: blocks.length,
        sweepCount: sweeps.length,
        sentiment: flow.callPremium > flow.putPremium * 1.2 ? "bullish" : flow.putPremium > flow.callPremium * 1.2 ? "bearish" : "neutral",
      },
    })
  } catch (err) {
    console.error("[v0] ticker options-flow route error", err)
    return NextResponse.json({ alerts: [], stats: null }, { status: 500 })
  }
}
