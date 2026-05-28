import { NextResponse } from "next/server"
import { getFinancials as getPolygonFinancials } from "@/lib/polygon"
import { getFinancials as getUWFinancials } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params

  // Try Polygon first (paid tier, comprehensive financials), fall back to UW
  const hasPolygon = !!process.env.POLYGON_API_KEY
  
  if (hasPolygon) {
    try {
      const polyData = await getPolygonFinancials(symbol)
      if (polyData.length > 0) {
        // Transform to match widget expected format
        const data = polyData.map((f) => ({
          period: f.fiscalPeriod,
          year: f.fiscalYear,
          date: f.filingDate,
          revenue: f.revenue,
          netIncome: f.netIncome,
          grossProfit: f.grossProfit,
          operatingIncome: f.operatingIncome,
          eps: f.eps,
          totalAssets: f.totalAssets,
          totalLiabilities: f.totalLiabilities,
          totalEquity: f.totalEquity,
          cash: f.cashAndEquivalents,
          operatingCashFlow: f.operatingCashFlow,
          freeCashFlow: f.freeCashFlow,
        }))
        return NextResponse.json({ data, source: "polygon" })
      }
    } catch (err) {
      console.error("[financials] Polygon error:", err)
    }
  }

  // Fall back to UW
  const data = await getUWFinancials(symbol)
  return NextResponse.json({ data, source: "unusual-whales" })
}
