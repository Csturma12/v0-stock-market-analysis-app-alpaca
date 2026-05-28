import { NextRequest, NextResponse } from "next/server"
import { getQuotes, isConfigured } from "@/lib/tradier"

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Tradier API not configured" },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(req.url)
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? []

  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 })
  }

  try {
    const quotes = await getQuotes(symbols)
    return NextResponse.json({ quotes })
  } catch (err) {
    console.error("[Tradier] Quote fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    )
  }
}
