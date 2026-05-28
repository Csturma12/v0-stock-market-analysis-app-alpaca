import { NextResponse } from "next/server"
import { getAnalystRatings as getUWRatings } from "@/lib/unusual-whales"
import { getPriceTarget, getRecommendationTrends } from "@/lib/finnhub"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const uw = await getUWRatings(symbol)
  if (uw.length > 0) {
    return NextResponse.json({ source: "unusual-whales", data: uw })
  }

  const [trends, target] = await Promise.all([getRecommendationTrends(symbol), getPriceTarget(symbol)])
  const latest = trends[0]
  const data = latest
    ? [
        {
          date: latest.period ?? "",
          firm: "Finnhub consensus",
          analyst: null,
          rating: "",
          priorRating: null,
          priceTarget: target?.targetMean ?? null,
          priorPriceTarget: null,
          action: "reiterated",
        },
      ]
    : []

  return NextResponse.json({
    source: trends.length > 0 ? "finnhub" : "none",
    data,
    consensus: trends,
    priceTarget: target,
  })
}
