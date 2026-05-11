import { NextResponse } from "next/server"
import { uw } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tickers = searchParams.get("tickers")?.split(",").slice(0, 20) ?? ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AMD"]
    const data = await uw().correlations(tickers)
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
