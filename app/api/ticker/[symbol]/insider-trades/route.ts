import { NextResponse } from "next/server"
import { getInsiderTrades } from "@/lib/unusual-whales"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  try {
    const trades = await getInsiderTrades(symbol)
    return NextResponse.json({ trades })
  } catch (err) {
    console.log("[v0] insider trades route error", err)
    return NextResponse.json({ trades: [] })
  }
}
