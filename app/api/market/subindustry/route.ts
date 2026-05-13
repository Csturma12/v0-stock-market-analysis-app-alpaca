import { NextResponse } from "next/server"
import { getSubIndustry } from "@/lib/constants"
import { getSnapshotBatch } from "@/lib/polygon"
import { getQuotes } from "@/lib/tradier"

export const revalidate = 60

// Use Tradier for quotes (real-time, no rate limit issues)
async function getQuotesViaTradier(tickers: string[]) {
  const quotes = await getQuotes(tickers)
  return quotes.map((q) => ({
    ticker: q.symbol,
    price: q.last ?? null,
    open: q.open ?? null,
    high: q.high ?? null,
    low: q.low ?? null,
    change: q.change ?? null,
    changePct: q.change_percentage ?? null,
    volume: q.volume ?? null,
  }))
}

// Use Polygon as fallback
async function getQuotesViaPolygon(tickers: string[]) {
  const snaps = await getSnapshotBatch(tickers)
  return snaps.map((s) => ({
    ticker: s.ticker,
    price: s.price,
    open: s.open,
    high: s.high,
    low: s.low,
    change: s.price != null && s.prevClose != null ? s.price - s.prevClose : null,
    changePct: s.changePct ?? null,
    volume: s.volume ?? null,
  }))
}

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

  // Try Polygon first (paid tier, higher limits), fall back to Tradier
  let data: Array<{
    ticker: string
    price: number | null
    open?: number | null
    high?: number | null
    low?: number | null
    change: number | null
    changePct: number | null
    volume: number | null
  }> = []
  
  const hasPolygon = !!process.env.POLYGON_API_KEY
  const hasTradier = !!process.env.TRADIER_API_KEY

  if (hasPolygon) {
    try {
      data = await getQuotesViaPolygon(tickers)
    } catch (err) {
      console.error("[subindustry] Polygon error:", err)
    }
  }

  // If Polygon returned nothing or isn't configured, try Tradier
  if (data.length === 0 && hasTradier) {
    try {
      data = await getQuotesViaTradier(tickers)
    } catch (err) {
      console.error("[subindustry] Tradier error:", err)
    }
  }

  return NextResponse.json({ data, tickers: data, updatedAt: new Date().toISOString() })
}
