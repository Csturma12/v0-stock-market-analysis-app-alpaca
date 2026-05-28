import { NextResponse } from "next/server"
import { getProfile, getBalances, getPositions, isConfigured } from "@/lib/tradier"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Tradier API not configured" },
      { status: 400 }
    )
  }

  try {
    const [profile, balances, positions] = await Promise.all([
      getProfile(),
      getBalances(),
      getPositions(),
    ])

    return NextResponse.json({
      connected: true,
      profile,
      balances,
      positions,
    })
  } catch (err) {
    console.error("[Tradier] Account fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch Tradier account data" },
      { status: 500 }
    )
  }
}
