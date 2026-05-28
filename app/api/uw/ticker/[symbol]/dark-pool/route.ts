import { getUnusualWhalesSummary } from "@/lib/unusual-whales"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params
    const summary = await getUnusualWhalesSummary(symbol, "weekly")
    if (!summary) {
      return NextResponse.json({ prints: [], stats: null })
    }
    const { darkPool } = summary
    const blocks = darkPool.prints.filter((p) => p.premium >= 500000)
    return NextResponse.json({
      prints: darkPool.prints,
      stats: {
        totalPremium: darkPool.totalPremium,
        totalSize: darkPool.totalSize,
        blockCount: blocks.length,
        blockPremium: blocks.reduce((s, p) => s + p.premium, 0),
        largest: darkPool.largestPrint,
      },
    })
  } catch (err) {
    console.error("[v0] ticker dark-pool route error", err)
    return NextResponse.json({ prints: [], stats: null }, { status: 500 })
  }
}
