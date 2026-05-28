import { NextResponse } from "next/server"

const UW_BASE = "https://api.unusualwhales.com/api"

function uwHeaders() {
  const key = process.env.UNUSUAL_WHALES_API_KEY
  if (!key) throw new Error("UNUSUAL_WHALES_API_KEY is not set")
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  }
}

export async function GET() {
  try {
    // Fetch recent flow alerts from Unusual Whales
    const res = await fetch(`${UW_BASE}/option-trades/flow-alerts?limit=20`, {
      headers: uwHeaders(),
      next: { revalidate: 10 }, // 10s cache
    })

    if (!res.ok) {
      return NextResponse.json({ signals: [] })
    }

    const data = await res.json()
    const alerts = data.data || []

    // Transform into dashboard signal format
    const signals = alerts.slice(0, 10).map((alert: any) => {
      const isBullish = alert.sentiment === "bullish" || alert.option_type === "call"
      const isBearish = alert.sentiment === "bearish" || alert.option_type === "put"
      
      // Calculate confidence based on premium and volume
      const premium = parseFloat(alert.premium) || 0
      const volume = parseInt(alert.volume) || 0
      const oi = parseInt(alert.open_interest) || 1
      const volOiRatio = volume / oi
      
      // Higher premium + higher vol/OI = higher confidence
      let confidence = 50
      if (premium > 1000000) confidence += 20
      else if (premium > 500000) confidence += 15
      else if (premium > 100000) confidence += 10
      
      if (volOiRatio > 2) confidence += 15
      else if (volOiRatio > 1) confidence += 10
      else if (volOiRatio > 0.5) confidence += 5

      confidence = Math.min(confidence, 95)

      return {
        ticker: alert.ticker_symbol || alert.underlying_symbol || "???",
        action: isBullish ? "BUY" : isBearish ? "SELL" : "NO_TRADE",
        setup: alert.option_type === "call" ? "Call Flow" : alert.option_type === "put" ? "Put Flow" : "Unusual Activity",
        confidence,
        premium,
        strike: parseFloat(alert.strike) || null,
        expiry: alert.expiration_date || null,
        sentiment: alert.sentiment || (isBullish ? "bullish" : isBearish ? "bearish" : "neutral"),
      }
    })

    return NextResponse.json({ signals })
  } catch (err) {
    console.error("[v0] Dashboard signals error:", err)
    return NextResponse.json({ signals: [] })
  }
}
