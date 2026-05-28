import { NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

function key() {
  const k = process.env.POLYGON_API_KEY
  if (!k) throw new Error("POLYGON_API_KEY is not set")
  return k
}

// Commodity and crypto tickers
const COMMODITIES = [
  { symbol: "C:XAUUSD", name: "Gold", type: "commodity" },
  { symbol: "C:XAGUSD", name: "Silver", type: "commodity" },
  { symbol: "C:CLUSD", name: "Crude Oil", type: "commodity" },
  { symbol: "C:NGUSD", name: "Natural Gas", type: "commodity" },
  { symbol: "X:BTCUSD", name: "Bitcoin", type: "crypto" },
  { symbol: "X:ETHUSD", name: "Ethereum", type: "crypto" },
  { symbol: "C:HGUSD", name: "Copper", type: "commodity" },
  { symbol: "C:PLUSD", name: "Platinum", type: "commodity" },
]

export async function GET() {
  try {
    const results = await Promise.allSettled(
      COMMODITIES.map(async (c) => {
        const url = `${POLYGON_BASE}/v2/aggs/ticker/${c.symbol}/prev?apiKey=${key()}`
        const res = await fetch(url, { next: { revalidate: 60 } })
        if (!res.ok) return null
        const data = await res.json()
        const r = data.results?.[0]
        if (!r) return null
        
        const changePct = r.o ? ((r.c - r.o) / r.o) * 100 : 0
        
        return {
          symbol: c.symbol,
          name: c.name,
          type: c.type,
          price: r.c,
          change: r.c - r.o,
          changePct,
          high: r.h,
          low: r.l,
          volume: r.v,
        }
      })
    )

    const commodities = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value)

    return NextResponse.json({ commodities })
  } catch (err) {
    console.error("[v0] Dashboard commodities error:", err)
    return NextResponse.json({ commodities: [] })
  }
}
