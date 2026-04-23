import { NextResponse } from "next/server"
import { getAggregatesRange, type PolygonTimespan } from "@/lib/polygon"

export const dynamic = "force-dynamic"

type RangeKey = "1D" | "1M" | "YTD" | "5Y"
type IntervalKey = "15m" | "1h" | "4h" | "1d" | "1w" | "1mo"

const INTERVAL_MAP: Record<IntervalKey, { multiplier: number; timespan: PolygonTimespan }> = {
  "15m": { multiplier: 15, timespan: "minute" },
  "1h": { multiplier: 1, timespan: "hour" },
  "4h": { multiplier: 4, timespan: "hour" },
  "1d": { multiplier: 1, timespan: "day" },
  "1w": { multiplier: 1, timespan: "week" },
  "1mo": { multiplier: 1, timespan: "month" },
}

const ALLOWED: Record<RangeKey, IntervalKey[]> = {
  "1D": ["15m", "1h", "4h"],
  "1M": ["1h", "4h", "1d"],
  YTD: ["4h", "1d", "1w"],
  "5Y": ["1d", "1w", "1mo"],
}

function computeFrom(range: RangeKey): Date {
  const now = new Date()
  if (range === "1D") {
    // 2 calendar days back so weekend/holiday requests still return the prior session
    return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  }
  if (range === "1M") {
    return new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
  }
  if (range === "YTD") {
    return new Date(now.getFullYear(), 0, 1)
  }
  // 5Y
  const d = new Date(now)
  d.setFullYear(d.getFullYear() - 5)
  return d
}

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const url = new URL(req.url)

  const range = (url.searchParams.get("range") as RangeKey) || "1M"
  let interval = (url.searchParams.get("interval") as IntervalKey) || "1d"

  const allowed = ALLOWED[range]
  if (!allowed) {
    return NextResponse.json({ error: "invalid range" }, { status: 400 })
  }
  if (!allowed.includes(interval)) {
    interval = allowed[allowed.length - 1]
  }

  const { multiplier, timespan } = INTERVAL_MAP[interval]
  const from = computeFrom(range)
  const to = new Date()

  const candles = await getAggregatesRange(sym, multiplier, timespan, from, to)

  return NextResponse.json({ symbol: sym, range, interval, candles })
}
