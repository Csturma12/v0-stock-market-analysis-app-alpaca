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

  // If FlashAlpha has IV data, transform it to match widget format
  if (faMetrics && faMetrics.iv_current != null) {
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

  // Fall back to UW data - transform to expected format if needed
  if (uwData && uwData.length > 0) {
    const data = uwData.map((d) => ({
      date: d.date,
      iv30: d.iv30,
      hv30: d.hv30,
      iv_rank: d.ivRank,
      iv_percentile: d.ivPercentile,
    }))
    return NextResponse.json({ data, source: "unusual-whales" })
  }

  // No data from either source
  return NextResponse.json({ data: [], source: null })
}
