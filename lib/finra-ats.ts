/**
 * FINRA ATS (Alternative Trading System) Dark Pool Data
 * Source: https://ats.finra.org / FINRA public API
 * Data is free, published weekly (typically 2-week lag).
 * Provides authoritative dark pool volume by ATS venue.
 */

const FINRA_BASE = "https://api.finra.org"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FinraATSRecord = {
  weeklyStartDate: string          // YYYY-MM-DD
  symbol: string
  totalWeeklyShareQuantity: number // Total dark pool shares for the week
  totalWeeklyTradeCount: number
  atsName: string                  // e.g. "CITADEL SECURITIES LLC"
}

export type FinraATSSummary = {
  symbol: string
  latestWeek: string | null
  totalDarkPoolShares: number
  totalDarkPoolTrades: number
  topVenues: {
    name: string
    shares: number
    trades: number
    pctOfTotal: number
  }[]
  weeklyTrend: {
    week: string
    shares: number
    trades: number
  }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────────────────────────────────────

async function finraFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${FINRA_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // cache 1 hour — data only updates weekly
    })
    if (!res.ok) {
      console.warn(`[FINRA] ${res.status} for ${path}`)
      return null
    }
    return res.json() as Promise<T>
  } catch (err) {
    console.error("[FINRA] fetch error:", err)
    return null
  }
}

/**
 * Fetch FINRA ATS dark pool data for a ticker.
 * Uses the FINRA market data API — OTC/ATS short interest data.
 */
export async function getFinraATSSummary(symbol: string): Promise<FinraATSSummary | null> {
  const sym = symbol.toUpperCase()

  // FINRA equity ATS endpoint — returns weekly dark pool volume by venue
  // Docs: https://developer.finra.org/docs#operation/getEquityATSData
  const records = await finraFetch<FinraATSRecord[]>(
    `/data/group/otcmarket/name/atsSymbol?limit=50&dateRangeFilters=weeklyStartDate,>=${getFromDate()}&domainFilters=symbol=${sym}`
  )

  if (!records || records.length === 0) {
    // Try alternative FINRA endpoint for OTC data
    return await getFinraOTCDarkPool(sym)
  }

  return buildSummary(sym, records)
}

/** Alternative: FINRA OTC Transparency data */
async function getFinraOTCDarkPool(symbol: string): Promise<FinraATSSummary | null> {
  // FINRA Weekly OTC Short Interest
  const res = await finraFetch<{ data: FinraATSRecord[] }>(
    `/data/group/otcmarket/name/otcIssueShortInterest?limit=20&domainFilters=symbol=${symbol}`
  )

  if (!res?.data?.length) return null
  return buildSummary(symbol, res.data)
}

function buildSummary(symbol: string, records: FinraATSRecord[]): FinraATSSummary {
  // Sort by week descending
  const sorted = [...records].sort((a, b) =>
    b.weeklyStartDate.localeCompare(a.weeklyStartDate)
  )

  // Group by venue
  const venueMap = new Map<string, { shares: number; trades: number }>()
  const weekMap = new Map<string, { shares: number; trades: number }>()

  let totalShares = 0
  let totalTrades = 0

  for (const r of sorted) {
    totalShares += r.totalWeeklyShareQuantity ?? 0
    totalTrades += r.totalWeeklyTradeCount ?? 0

    const ven = venueMap.get(r.atsName) ?? { shares: 0, trades: 0 }
    ven.shares += r.totalWeeklyShareQuantity ?? 0
    ven.trades += r.totalWeeklyTradeCount ?? 0
    venueMap.set(r.atsName, ven)

    const wk = weekMap.get(r.weeklyStartDate) ?? { shares: 0, trades: 0 }
    wk.shares += r.totalWeeklyShareQuantity ?? 0
    wk.trades += r.totalWeeklyTradeCount ?? 0
    weekMap.set(r.weeklyStartDate, wk)
  }

  const topVenues = [...venueMap.entries()]
    .sort((a, b) => b[1].shares - a[1].shares)
    .slice(0, 5)
    .map(([name, v]) => ({
      name,
      shares: v.shares,
      trades: v.trades,
      pctOfTotal: totalShares > 0 ? Math.round((v.shares / totalShares) * 1000) / 10 : 0,
    }))

  const weeklyTrend = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8) // last 8 weeks
    .map(([week, v]) => ({ week, shares: v.shares, trades: v.trades }))

  return {
    symbol,
    latestWeek: sorted[0]?.weeklyStartDate ?? null,
    totalDarkPoolShares: totalShares,
    totalDarkPoolTrades: totalTrades,
    topVenues,
    weeklyTrend,
  }
}

function getFromDate(): string {
  // Pull 8 weeks of data
  const d = new Date()
  d.setDate(d.getDate() - 56)
  return d.toISOString().slice(0, 10)
}

/** Format FINRA data for LLM context */
export function formatFinraForLLM(summary: FinraATSSummary): string {
  if (!summary.latestWeek) return "(FINRA ATS dark pool data not available)"

  return `FINRA ATS DARK POOL (as of week ${summary.latestWeek}, 2-week lag):
Total Shares: ${summary.totalDarkPoolShares.toLocaleString()} | Total Trades: ${summary.totalDarkPoolTrades.toLocaleString()}

Top Dark Pool Venues:
${summary.topVenues.map((v) => `  ${v.name}: ${v.shares.toLocaleString()} shares (${v.pctOfTotal}%)`).join("\n")}

8-Week Dark Pool Trend:
${summary.weeklyTrend.slice(-4).map((w) => `  ${w.week}: ${w.shares.toLocaleString()} shares`).join("\n")}`
}
