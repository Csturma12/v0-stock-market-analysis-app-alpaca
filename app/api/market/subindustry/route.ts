import { NextResponse } from "next/server"
import { getSubIndustry } from "@/lib/constants"
import { getSnapshotBatch } from "@/lib/polygon"

export const revalidate = 60

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sector = url.searchParams.get("sector") ?? ""
  const sub = url.searchParams.get("sub") ?? ""
  const tickersParam = url.searchParams.get("tickers")

  let tickers: string[] = []
  if (tickersParam) {
    tickers = tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
  } else {
    const ctx = getSubIndustry(sector, sub)
    if (!ctx?.sub) return NextResponse.json({ error: "not found" }, { status: 404 })
    tickers = ctx.sub.tickers
  }

  const snaps = await getSnapshotBatch(tickers)
  // Component shape: { ticker, price, change, changePct, volume }
  const data = snaps.map((s) => ({
    ticker: s.ticker,
    price: s.price,
    change: s.price != null && s.prevClose != null ? s.price - s.prevClose : null,
    changePct: s.changePct ?? null,
    volume: s.volume ?? null,
  }))

  return NextResponse.json({ data, tickers: data, updatedAt: new Date().toISOString() })
}
