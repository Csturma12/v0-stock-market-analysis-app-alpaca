import { NextResponse } from "next/server"
import { getFlowAlerts } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

// Greek flow aggregates flow alerts by greek exposure
export async function GET() {
  try {
    const alerts = await getFlowAlerts(200)
    
    // Aggregate by ticker for greek exposure summary
    const byTicker: Record<string, { delta: number; gamma: number; vega: number; premium: number }> = {}
    
    for (const alert of alerts) {
      const ticker = alert.ticker
      if (!byTicker[ticker]) {
        byTicker[ticker] = { delta: 0, gamma: 0, vega: 0, premium: 0 }
      }
      // Estimate greeks from alert data
      const sign = alert.sentiment === "bullish" ? 1 : -1
      const premium = alert.premium ?? 0
      byTicker[ticker].premium += premium
      byTicker[ticker].delta += sign * premium * 0.5
      byTicker[ticker].gamma += premium * 0.05
      byTicker[ticker].vega += premium * 0.1
    }
    
    const data = Object.entries(byTicker)
      .map(([ticker, greeks]) => ({ ticker, ...greeks }))
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 20)
    
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
