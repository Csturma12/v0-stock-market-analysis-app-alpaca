import { NextResponse } from "next/server"
import { getAggregatesTF, type Timeframe } from "@/lib/polygon"

export const dynamic = "force-dynamic"

const VALID: Timeframe[] = ["15m", "1h", "4h", "1d"]

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const url = new URL(req.url)
  const tfParam = (url.searchParams.get("tf") ?? "1d") as Timeframe
  const tf: Timeframe = VALID.includes(tfParam) ? tfParam : "1d"

  const candles = await getAggregatesTF(symbol.toUpperCase(), tf)
  return NextResponse.json({ symbol: symbol.toUpperCase(), timeframe: tf, candles })
}
