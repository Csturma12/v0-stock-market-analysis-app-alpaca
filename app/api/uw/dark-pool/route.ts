import { getMarketDarkPool } from "@/lib/unusual-whales"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const prints = await getMarketDarkPool(150)
    const totalPremium = prints.reduce((s, p) => s + p.premium, 0)
    const totalSize = prints.reduce((s, p) => s + p.size, 0)
    const blocks = prints.filter((p) => p.premium >= 500000)
    const blockPremium = blocks.reduce((s, p) => s + p.premium, 0)
    const largest = prints.reduce<typeof prints[0] | null>((m, p) => (!m || p.premium > m.premium ? p : m), null)
    return NextResponse.json({
      prints,
      stats: { totalPremium, totalSize, blockCount: blocks.length, blockPremium, largest },
    })
  } catch (err) {
    console.error("[v0] dark-pool route error", err)
    return NextResponse.json({ prints: [], stats: null }, { status: 500 })
  }
}
