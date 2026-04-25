import { NextResponse } from "next/server"
import { getSnapshot, getAggregates, getTickerDetails } from "@/lib/polygon"
import {
  getCompanyProfile,
  getBasicFinancials,
  getRecommendationTrends,
  getPriceTarget,
  getInsiderSentiment,
} from "@/lib/finnhub"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const [snapshot, profile, metrics, candles, recommendations, priceTarget, insider, details, candles200] = await Promise.all([
    getSnapshot(sym),
    getCompanyProfile(sym),
    getBasicFinancials(sym),
    getAggregates(sym, 90),
    getRecommendationTrends(sym),
    getPriceTarget(sym),
    getInsiderSentiment(sym),
    getTickerDetails(sym),
    getAggregates(sym, 365), // ~1 year for 200-day SMA (need 280+ calendar days for 200 trading days)
  ])

  const closes = candles.map((c) => c.close)
  const volumes = candles.map((c) => c.volume)
  const closes200 = candles200.map((c) => c.close)

  const sma14 = sma(closes, 14)
  const sma20 = sma(closes, 20)
  const sma50 = sma(closes200, 50)
  const sma200 = sma(closes200, 200)
  const rsi14 = rsi(closes, 14)
  const avgVol = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null
  const latestVol = volumes[volumes.length - 1] ?? null
  const volumeRatio = latestVol && avgVol ? latestVol / avgVol : null

  const momentum5 =
    closes.length > 5 ? (closes[closes.length - 1] / closes[closes.length - 6] - 1) * 100 : null
  const momentum20 =
    closes.length > 20 ? (closes[closes.length - 1] / closes[closes.length - 21] - 1) * 100 : null

  // Compute weekly (5 days) and monthly (21 days) high/low from recent candles
  const last5 = candles.slice(-5)
  const last21 = candles.slice(-21)
  const weeklyHigh = last5.length ? Math.max(...last5.map((c) => c.high)) : null
  const weeklyLow = last5.length ? Math.min(...last5.map((c) => c.low)) : null
  const monthlyHigh = last21.length ? Math.max(...last21.map((c) => c.high)) : null
  const monthlyLow = last21.length ? Math.min(...last21.map((c) => c.low)) : null

  // Chart data in both shapes for back-compat
  const chartCandles = candles.map((c) => ({
    t: new Date(c.date).getTime(),
    c: c.close,
    date: c.date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }))

  return NextResponse.json({
    symbol: sym,
    snapshot,
    profile: profile
      ? {
          ...profile,
          // back-compat aliases for older components
          finnhubIndustry: profile.industry,
          marketCapitalization: profile.marketCap,
        }
      : null,
    details,
    metrics,
    candles: chartCandles,
    technicals: {
      sma14: sma14[sma14.length - 1] ?? null,
      sma20: sma20[sma20.length - 1] ?? null,
      sma50: sma50[sma50.length - 1] ?? null,
      sma200: sma200[sma200.length - 1] ?? null,
      rsi14: rsi14[rsi14.length - 1] ?? null,
      avgVolume: avgVol,
      latestVolume: latestVol,
      volumeRatio,
      momentum5,
      momentum20,
      weeklyHigh,
      weeklyLow,
      monthlyHigh,
      monthlyLow,
    },
    recommendations,
    priceTarget,
    insider,
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
