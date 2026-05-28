import { NextRequest, NextResponse } from "next/server"
import { getQuote, getOptionExpirations, isConfigured } from "@/lib/tradier"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Tradier not configured", quote: null, expirations: [] })
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required", quote: null, expirations: [] })
  }

  try {
    const [quote, expirations] = await Promise.all([
      getQuote(symbol),
      getOptionExpirations(symbol),
    ])

    return NextResponse.json({ quote, expirations })
  } catch (err) {
    console.error("[Tradier Market] Error:", err)
    return NextResponse.json({ error: "Failed to fetch data", quote: null, expirations: [] })
  }
}
