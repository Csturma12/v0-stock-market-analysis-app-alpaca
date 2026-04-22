import { NextResponse } from "next/server"
import { polygon } from "@/lib/polygon"
import { finnhub } from "@/lib/finnhub"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const [snapshot, profile, metrics, candles, recommendations, earnings] = await Promise.all([
    polygon.snapshot(sym).catch(() => null),
    finnhub.profile(sym).catch(() => null),
    finnhub.basicFinancials(sym).catch(() => null),
    polygon.aggregates(sym, 90).catch(() => []),
    finnhub.recommendations(sym).catch(() => []),
    finnhub.earnings(sym).catch(() => []),
  ])

  // Simple technical indicators
  const closes = candles.map((c) => c.c)
  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const rsi14 = rsi(closes, 14)
  const volumes = candles.map((c) => c.v)
  const avgVol = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null
  const latestVol = volumes[volumes.length - 1] ?? null
  const volumeRatio = latestVol && avgVol ? latestVol / avgVol : null

  // Momentum
  const momentum5 = closes.length > 5 ? (closes[closes.length - 1] / closes[closes.length - 6] - 1) * 100 : null
  const momentum20 =
    closes.length > 20 ? (closes[closes.length - 1] / closes[closes.length - 21] - 1) * 100 : null

  return NextResponse.json({
    symbol: sym,
    snapshot,
    profile,
    metrics: metrics?.metric ?? null,
    candles,
    technicals: {
      sma20: sma20[sma20.length - 1] ?? null,
      sma50: sma50[sma50.length - 1] ?? null,
      rsi14: rsi14[rsi14.length - 1] ?? null,
      avgVolume: avgVol,
      latestVolume: latestVol,
      volumeRatio,
      momentum5,
      momentum20,
    },
    recommendations,
    earnings,
  })
}

function sma(data: number[], period: number): number[] {
  const out: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      out.push(NaN)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    out.push(sum / period)
  }
  return out
}

function rsi(data: number[], period: number): number[] {
  const out: number[] = []
  let gains = 0
  let losses = 0
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    if (i <= period) {
      if (diff >= 0) gains += diff
      else losses -= diff
      if (i === period) {
        const avgG = gains / period
        const avgL = losses / period
        out.push(100 - 100 / (1 + avgG / (avgL || 1e-9)))
      } else {
        out.push(NaN)
      }
    } else {
      const g = diff > 0 ? diff : 0
      const l = diff < 0 ? -diff : 0
      gains = (gains * (period - 1) + g) / period
      losses = (losses * (period - 1) + l) / period
      out.push(100 - 100 / (1 + gains / (losses || 1e-9)))
    }
  }
  return out
}
