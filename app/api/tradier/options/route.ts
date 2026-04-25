import { NextRequest, NextResponse } from "next/server"
import { getOptionChain, getOptionExpirations, isConfigured } from "@/lib/tradier"

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Tradier API not configured" },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")
  const expiration = searchParams.get("expiration")

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 })
  }

  try {
    // If no expiration provided, return available expirations
    if (!expiration) {
      const expirations = await getOptionExpirations(symbol)
      return NextResponse.json({ expirations })
    }

    // Otherwise return the option chain for that expiration
    const chain = await getOptionChain(symbol, expiration, true)
    return NextResponse.json({ chain })
  } catch (err) {
    console.error("[Tradier] Options fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch options data" },
      { status: 500 }
    )
  }
}
