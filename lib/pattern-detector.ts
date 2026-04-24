import type { OHLCV } from "@/lib/polygon"

export type DetectedPattern = {
  type: "uptrend_pullback" | "mean_reversion" | "range_bound" | "breakout" | "accumulation"
  name: string
  strength: number // 0-100 confidence
  tradeable: boolean
  recommendation: string
  frequency: "weekly" | "monthly" | "daily"
  avgReturn: number // avg % return on pattern
  winRate: number // 0-100
  description: string
}

/**
 * Detect tradeable patterns from OHLCV bars
 * NVDA pattern example: consistent uptrends with shallow pullbacks (strong uptrend + low floor)
 */
export function detectPatterns(bars: OHLCV[]): DetectedPattern[] {
  if (bars.length < 20) return []

  const patterns: DetectedPattern[] = []

  // Sort by timestamp ascending
  const sorted = [...bars].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())

  // 1. Uptrend + Pullback Pattern (NVDA-like)
  const uptrendPullback = detectUptrendPullback(sorted)
  if (uptrendPullback) patterns.push(uptrendPullback)

  // 2. Mean Reversion Pattern
  const meanReversion = detectMeanReversion(sorted)
  if (meanReversion) patterns.push(meanReversion)

  // 3. Range-Bound Pattern
  const rangeBound = detectRangeBound(sorted)
  if (rangeBound) patterns.push(rangeBound)

  // 4. Accumulation Pattern (for swing/position trades)
  const accumulation = detectAccumulation(sorted)
  if (accumulation) patterns.push(accumulation)

  return patterns.filter((p) => p.tradeable).sort((a, b) => b.strength - a.strength)
}

/**
 * Uptrend + Pullback: Stock makes consistent new highs, but pullbacks are shallow (>80% of gains retained)
 * Great for: Weekly call spreads, covered calls, long bias
 */
function detectUptrendPullback(bars: OHLCV[]): DetectedPattern | null {
  const recent = bars.slice(-20) // Last 20 bars (4 weeks daily, or 4 months weekly)

  let troughs = 0
  let peaks = 0
  let totalGain = 0
  let maxPullback = 0

  for (let i = 1; i < recent.length - 1; i++) {
    const prev = recent[i - 1].c
    const curr = recent[i].c
    const next = recent[i + 1].c

    // Local peak
    if (curr > prev && curr >= next) peaks++
    // Local trough
    if (curr < prev && curr <= next) troughs++
  }

  const startPrice = recent[0].c
  const endPrice = recent[recent.length - 1].c
  totalGain = ((endPrice - startPrice) / startPrice) * 100

  // Calculate max pullback as % of the move
  const highestPrice = Math.max(...recent.map((b) => b.h))
  const lowestSinceHigh = Math.min(...recent.filter((b) => b.h >= highestPrice * 0.99).map((b) => b.l))
  maxPullback = ((highestPrice - lowestSinceHigh) / highestPrice) * 100

  // Pattern: uptrend (total gain > 5%), multiple peaks and troughs, shallow pullbacks (<8%)
  if (totalGain > 5 && peaks >= 2 && maxPullback < 8) {
    return {
      type: "uptrend_pullback",
      name: "Uptrend with Shallow Pullbacks",
      strength: Math.min(100, 60 + (totalGain * 5 - 15)), // Higher gains = higher confidence
      tradeable: true,
      recommendation: "Sell OTM call spreads or covered calls weekly; strong floor support",
      frequency: "weekly",
      avgReturn: Math.min(5, totalGain / 4), // Conservative estimate
      winRate: 65,
      description: `Stock up ${totalGain.toFixed(1)}% over period with shallow ${maxPullback.toFixed(1)}% pullbacks. Consistent trend structure.`,
    }
  }

  return null
}

/**
 * Mean Reversion: Stock oscillates around a moving average, bouncing off support/resistance
 * Great for: Iron condors, weekly strangles, theta plays
 */
function detectMeanReversion(bars: OHLCV[]): DetectedPattern | null {
  const recent = bars.slice(-30)
  const closes = recent.map((b) => b.c)
  const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20

  let touchesBelow = 0
  let touchesAbove = 0
  let totalOscillation = 0

  recent.forEach((bar) => {
    if (bar.l < sma20) touchesBelow++
    if (bar.h > sma20) touchesAbove++
    totalOscillation += Math.abs(bar.c - sma20)
  })

  const avgDeviation = totalOscillation / recent.length
  const oscillationRatio = avgDeviation / sma20 // How far it swings from MA

  // Pattern: bounces off MA from both sides, moderate oscillation (2-4% of price)
  if (touchesBelow >= 5 && touchesAbove >= 5 && oscillationRatio > 0.015 && oscillationRatio < 0.04) {
    return {
      type: "mean_reversion",
      name: "Mean Reversion Oscillator",
      strength: Math.min(100, 50 + (oscillationRatio * 1000)),
      tradeable: true,
      recommendation: "Sell strangles or iron condors; fade extremes; theta decay favors short options",
      frequency: "weekly",
      avgReturn: 2.5,
      winRate: 60,
      description: `Consistently bounces off ${sma20.toFixed(2)} support/resistance. ${oscillationRatio.toFixed(3)} oscillation ratio.`,
    }
  }

  return null
}

/**
 * Range-Bound: Stock trades within clear support/resistance bands
 * Great for: Weekly spreads (buy low, sell high within band)
 */
function detectRangeBound(bars: OHLCV[]): DetectedPattern | null {
  const recent = bars.slice(-40)
  const highs = recent.map((b) => b.h)
  const lows = recent.map((b) => b.l)
  const closes = recent.map((b) => b.c)

  const resistance = Math.max(...highs)
  const support = Math.min(...lows)
  const range = resistance - support
  const rangePercent = (range / support) * 100

  // Count touches of support/resistance
  const touchSupport = lows.filter((l) => l <= support * 1.01).length
  const touchResistance = highs.filter((h) => h >= resistance * 0.99).length

  // Pattern: clear range with multiple touches, 3-8% range
  if (rangePercent > 3 && rangePercent < 8 && touchSupport >= 3 && touchResistance >= 3) {
    return {
      type: "range_bound",
      name: "Range-Bound Trading",
      strength: Math.min(100, 55 + (rangePercent * 5)),
      tradeable: true,
      recommendation: "Buy near support (${support.toFixed(2)}), sell near resistance (${resistance.toFixed(2)}); vertical spreads",
      frequency: "weekly",
      avgReturn: rangePercent * 0.3, // 30% of range as target
      winRate: 58,
      description: `Clear range: support ${support.toFixed(2)}, resistance ${resistance.toFixed(2)} (${rangePercent.toFixed(1)}% range)`,
    }
  }

  return null
}

/**
 * Accumulation: Stock consolidating on heavy volume or showing inside days
 * Great for: Breakout trades, positioning before catalysts
 */
function detectAccumulation(bars: OHLCV[]): DetectedPattern | null {
  const recent = bars.slice(-15)
  const ranges = recent.map((b) => b.h - b.l)
  const avgRange = ranges.reduce((a, b) => a + b) / ranges.length
  const volatility = Math.max(...ranges) - Math.min(...ranges)

  // Inside days: today's range fully contained within yesterday's
  let insideDays = 0
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1]
    const curr = recent[i]
    if (curr.l >= prev.l && curr.h <= prev.h) insideDays++
  }

  // Pattern: multiple inside days + low volatility
  if (insideDays >= 3 && volatility < avgRange * 0.5) {
    return {
      type: "accumulation",
      name: "Accumulation / Breakout Setup",
      strength: Math.min(100, 50 + insideDays * 8),
      tradeable: true,
      recommendation: "Monitor for breakout on volume; position for 1-2 month swing",
      frequency: "monthly",
      avgReturn: 5,
      winRate: 55,
      description: `${insideDays} inside days detected. Low volatility consolidation suggests breakout imminent.`,
    }
  }

  return null
}

/**
 * Score a pattern for autonomous trading viability
 * Higher score = more reliable for automated execution
 */
export function scorePatternForAutonomy(pattern: DetectedPattern): number {
  let score = 0

  // Base score from strength
  score += pattern.strength * 0.4

  // Win rate
  score += Math.max(0, (pattern.winRate - 50) * 2) // Bonus for >50% win rate

  // Return profile
  score += Math.min(20, pattern.avgReturn * 2) // Cap at 20pts

  // Frequency (more frequent = more data points, more reliable)
  if (pattern.frequency === "weekly") score += 15
  else if (pattern.frequency === "monthly") score += 10
  else score += 5

  return Math.min(100, score)
}
