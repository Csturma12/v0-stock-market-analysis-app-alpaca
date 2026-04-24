import { NextResponse } from "next/server"
import { getCongressionalTrades } from "@/lib/unusual-whales"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  try {
    const trades = await getCongressionalTrades(symbol)
    return NextResponse.json({ trades })
  } catch (err) {
    console.log("[v0] congressional trades route error", err)
    return NextResponse.json({ trades: [] })
  }
}
