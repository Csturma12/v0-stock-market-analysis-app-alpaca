import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Correlations endpoint - returns mock correlation matrix
// TODO: Implement actual correlation calculation from price data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tickers = searchParams.get("tickers")?.split(",").slice(0, 20) ?? ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AMD"]
    
    // Generate mock correlation matrix
    const matrix: Record<string, Record<string, number>> = {}
    for (const t1 of tickers) {
      matrix[t1] = {}
      for (const t2 of tickers) {
        if (t1 === t2) {
          matrix[t1][t2] = 1
        } else {
          // Generate pseudo-random but deterministic correlation
          const seed = (t1.charCodeAt(0) + t2.charCodeAt(0)) / 200
          matrix[t1][t2] = Math.round((0.3 + seed * 0.5) * 100) / 100
        }
      }
    }
    
    return NextResponse.json({ data: { tickers, matrix } })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
