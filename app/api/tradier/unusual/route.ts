import { NextRequest, NextResponse } from "next/server"
import { getTradierFlowSummary } from "@/lib/tradier-unusual-activity"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const flow = await getTradierFlowSummary(symbol.toUpperCase())
  if (!flow) return NextResponse.json({ error: "Failed to fetch flow data" }, { status: 500 })

  return NextResponse.json({ data: flow })
}
