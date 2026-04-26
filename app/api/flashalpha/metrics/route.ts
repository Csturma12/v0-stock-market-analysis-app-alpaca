import { NextRequest, NextResponse } from "next/server"
import { getFullMetrics, isConfigured } from "@/lib/flashalpha"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  if (!isConfigured()) {
    return NextResponse.json({ error: "FLASHALPHA_API_KEY not configured", configured: false }, { status: 200 })
  }

  const metrics = await getFullMetrics(symbol.toUpperCase())
  return NextResponse.json({ data: metrics, configured: true })
}
