import { getFlowAlerts, getHottestChains } from "@/lib/unusual-whales"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [alerts, chains] = await Promise.all([getFlowAlerts(150), getHottestChains(20)])
    const callPrem = alerts.filter((a) => a.type === "call").reduce((s, a) => s + a.premium, 0)
    const putPrem = alerts.filter((a) => a.type === "put").reduce((s, a) => s + a.premium, 0)
    const blocks = alerts.filter((a) => a.isBlock)
    const sweeps = alerts.filter((a) => a.isSweep)
    return NextResponse.json({
      alerts,
      chains,
      stats: {
        callPremium: callPrem,
        putPremium: putPrem,
        callPutRatio: putPrem > 0 ? callPrem / putPrem : 0,
        blockCount: blocks.length,
        sweepCount: sweeps.length,
        sentiment: callPrem > putPrem * 1.2 ? "bullish" : putPrem > callPrem * 1.2 ? "bearish" : "neutral",
      },
    })
  } catch (err) {
    console.error("[v0] flow-alerts route error", err)
    return NextResponse.json({ alerts: [], chains: [], stats: null }, { status: 500 })
  }
}
