import { NextResponse } from "next/server"
import { getVolatility } from "@/lib/unusual-whales"
import { getIVMetrics } from "@/lib/flashalpha"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params

  // Try FlashAlpha first (institutional-grade IV data), fall back to UW
  const [faMetrics, uwData] = await Promise.all([
    getIVMetrics(symbol),
    getVolatility(symbol),
  ])

  // If FlashAlpha has data, transform it to match widget format
  if (faMetrics) {
    const data = [{
      date: faMetrics.date,
      iv30: faMetrics.iv_current ?? null,
      hv30: faMetrics.iv_current && faMetrics.iv_hv_spread 
        ? (faMetrics.iv_current - faMetrics.iv_hv_spread) 
        : null,
      iv_rank: faMetrics.iv_rank ?? null,
      iv_percentile: faMetrics.iv_percentile ?? null,
      term_structure: faMetrics.term_structure,
    }]
    return NextResponse.json({ data, source: "flashalpha" })
  }

  // Fall back to UW data
  return NextResponse.json({ data: uwData, source: "unusual-whales" })
}
