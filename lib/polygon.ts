// Polygon.io REST client. Free tier: 5 req/min, 15-min delayed.
const BASE = "https://api.polygon.io"

function key() {
  const k = process.env.POLYGON_API_KEY ?? process.env.POLYGON_KEY
  if (!k) throw new Error("POLYGON_API_KEY or POLYGON_KEY is not set")
  return k
}

async function poly<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  url.searchParams.set("apiKey", key())
  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Polygon ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export type PrevClose = {
  ticker: string
  close: number
  open: number
  high: number
  low: number
  volume: number
  changePct: number
}

export async function getPrevClose(ticker: string): Promise<PrevClose | null> {
  try {
    const data = await poly<{ results?: any[] }>(`/v2/aggs/ticker/${ticker}/prev`)
    const r = data.results?.[0]
    if (!r) return null
    return {
      ticker,
      close: r.c,
      open: r.o,
      high: r.h,
      low: r.l,
      volume: r.v,
      changePct: ((r.c - r.o) / r.o) * 100,
    }
  } catch {
    return null
  }
}

export async function getSnapshot(ticker: string) {
  try {
    const data = await poly<{ ticker?: any }>(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`)
    const t = data.ticker
    if (!t) return null
    const day = t.day ?? {}
    const prev = t.prevDay ?? {}
    const price = day.c || prev.c || 0
    const prevClose = prev.c || 0
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
    return {
      ticker,
      price,
      prevClose,
      changePct,
      volume: day.v || 0,
      high: day.h || 0,
      low: day.l || 0,
      open: day.o || 0,
    }
  } catch {
    return null
  }
}

export async function getAggregates(ticker: string, days = 90) {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  try {
    const data = await poly<{ results?: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> }>(
      `/v2/aggs/ticker/${ticker}/range/1/day/${fmt(from)}/${fmt(to)}`,
      { adjusted: "true", sort: "asc", limit: 500 },
    )
    return (
      data.results?.map((r) => ({
        date: new Date(r.t).toISOString().slice(0, 10),
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v,
      })) ?? []
    )
  } catch {
    return []
  }
}

export type PolygonTimespan = "minute" | "hour" | "day" | "week" | "month"

export type TFCandle = {
  t: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Flexible OHLC fetch: any multiplier + timespan + explicit date window.
export async function getAggregatesRange(
  ticker: string,
  multiplier: number,
  timespan: PolygonTimespan,
  fromDate: Date,
  toDate: Date,
): Promise<TFCandle[]> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  try {
    const data = await poly<{ results?: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> }>(
      `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${fmt(fromDate)}/${fmt(toDate)}`,
      { adjusted: "true", sort: "asc", limit: 50000 },
    )
    return (
      data.results?.map((r) => ({
        t: r.t,
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v,
      })) ?? []
    )
  } catch {
    return []
  }
}

export async function getTickerNews(ticker: string, limit = 20) {
  try {
    const data = await poly<{ results?: any[] }>(`/v2/reference/news`, { "ticker": ticker, limit, order: "desc" })
    return (
      data.results?.map((n) => ({
        id: n.id,
        title: n.title,
        author: n.author,
        publisher: n.publisher?.name ?? "",
        url: n.article_url,
        imageUrl: n.image_url,
        description: n.description,
        publishedAt: n.published_utc,
        tickers: n.tickers ?? [],
        sentiment: n.insights?.[0]?.sentiment,
        sentimentReasoning: n.insights?.[0]?.sentiment_reasoning,
      })) ?? []
    )
  } catch {
    return []
  }
}

export async function getTickerDetails(ticker: string) {
  try {
    const data = await poly<{ results?: any }>(`/v3/reference/tickers/${ticker}`)
    const r = data.results
    if (!r) return null
    return {
      ticker: r.ticker,
      name: r.name,
      description: r.description,
      marketCap: r.market_cap,
      shares: r.weighted_shares_outstanding,
      homepageUrl: r.homepage_url,
      listDate: r.list_date,
      industry: r.sic_description,
      logoUrl: r.branding?.logo_url ? `${r.branding.logo_url}?apiKey=${key()}` : null,
    }
  } catch {
    return null
  }
}

export type TickerSearchResult = {
  ticker: string
  name: string
  market: string
  primaryExchange: string
  type: string
  active: boolean
  tvSymbol: string
}

export type OHLCV = {
  t: string // timestamp
  o: number // open
  h: number // high
  l: number // low
  c: number // close
  v: number // volume
}

export async function getBars(
  ticker: string,
  timeframe: "minute" | "hour" | "day" | "week" | "month" = "day",
  limit = 40,
): Promise<OHLCV[]> {
  try {
    const data = await poly<{ results?: any[] }>(`/v2/aggs/ticker/${ticker}/range/1/${timeframe}/`, {
      limit,
      sort: "asc",
    })
    return (
      data.results?.map((r) => ({
        t: new Date(r.t).toISOString(),
        o: r.o,
        h: r.h,
        l: r.l,
        c: r.c,
        v: r.v,
      })) ?? []
    )
  } catch {
    return []
  }
}

export async function searchTickers(query: string, limit = 10): Promise<TickerSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const data = await poly<{ results?: any[] }>(`/v3/reference/tickers`, {
      search: q,
      active: "true",
      limit,
      order: "desc",
      sort: "ticker",
    })
    const exchangeMap: Record<string, string> = {
      XNAS: "NASDAQ",
      XNYS: "NYSE",
      ARCX: "AMEX",
      BATS: "BATS",
      IEX: "IEX",
      XASE: "AMEX",
      XNCM: "NASDAQ",
      OTC: "OTC",
    }
    const normalizeExchange = (exchange: string) => {
      const cleaned = exchangeMap[exchange.toUpperCase()] ?? exchange.toUpperCase()
      return cleaned.replace(/^NYSE ARCA$/, "NYSEARCA").replace(/^NYSE ARCA$/i, "NYSEARCA")
    }
    const toTvSymbol = (ticker: string, exchange: string) => {
      const ex = normalizeExchange(exchange)
      return ex ? `${ex}:${ticker}` : ticker
    }
    const normalized = (data.results ?? []).map((r) => ({
      ticker: r.ticker,
      name: r.name ?? "",
      market: r.market ?? "",
      primaryExchange: r.primary_exchange ?? "",
      type: r.type ?? "",
      active: !!r.active,
      tvSymbol: toTvSymbol(r.ticker, r.primary_exchange ?? ""),
    }))

    const exact = q.toUpperCase()
    return normalized.sort((a, b) => {
      const aExact = a.ticker.toUpperCase() === exact ? 0 : 1
      const bExact = b.ticker.toUpperCase() === exact ? 0 : 1
      if (aExact !== bExact) return aExact - bExact

      const aStarts = a.ticker.toUpperCase().startsWith(exact) ? 0 : 1
      const bStarts = b.ticker.toUpperCase().startsWith(exact) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts

      const aName = a.name.toUpperCase().includes(exact) ? 0 : 1
      const bName = b.name.toUpperCase().includes(exact) ? 0 : 1
      if (aName !== bName) return aName - bName

      return a.ticker.localeCompare(b.ticker)
    }).slice(0, limit)
  } catch {
    return []
  }
}

// Batched snapshot for sector/sub-industry heatmaps. Uses the grouped daily endpoint when possible,
// falls back to per-ticker snapshot calls. To stay under free-tier limits we serialize.
export async function getSnapshotBatch(tickers: string[]) {
  const out: Array<NonNullable<Awaited<ReturnType<typeof getSnapshot>>>> = []
  // Parallel with a small cap to avoid 429s on free tier.
  const CHUNK = 5 // Increased for paid tier
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const slice = tickers.slice(i, i + CHUNK)
    const results = await Promise.all(slice.map((t) => getSnapshot(t)))
    for (const r of results) if (r) out.push(r)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Financials / Fundamentals (Paid tier - vX endpoints)
// ─────────────────────────────────────────────────────────────────────────────

export type FinancialStatement = {
  fiscalPeriod: string
  fiscalYear: number
  filingDate: string
  revenue: number | null
  netIncome: number | null
  grossProfit: number | null
  operatingIncome: number | null
  eps: number | null
  epsBasic: number | null
  totalAssets: number | null
  totalLiabilities: number | null
  totalEquity: number | null
  cashAndEquivalents: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
}

export async function getFinancials(ticker: string, limit = 8): Promise<FinancialStatement[]> {
  try {
    const data = await poly<{ results?: any[] }>(
      `/vX/reference/financials`,
      { ticker, timeframe: "quarterly", limit, order: "desc", sort: "filing_date" }
    )
    return (
      data.results?.map((r) => {
        const inc = r.financials?.income_statement ?? {}
        const bal = r.financials?.balance_sheet ?? {}
        const cf = r.financials?.cash_flow_statement ?? {}
        return {
          fiscalPeriod: r.fiscal_period ?? "",
          fiscalYear: r.fiscal_year ?? 0,
          filingDate: r.filing_date ?? "",
          revenue: inc.revenues?.value ?? null,
          netIncome: inc.net_income_loss?.value ?? null,
          grossProfit: inc.gross_profit?.value ?? null,
          operatingIncome: inc.operating_income_loss?.value ?? null,
          eps: inc.basic_earnings_per_share?.value ?? null,
          epsBasic: inc.diluted_earnings_per_share?.value ?? null,
          totalAssets: bal.assets?.value ?? null,
          totalLiabilities: bal.liabilities?.value ?? null,
          totalEquity: bal.equity?.value ?? null,
          cashAndEquivalents: bal.cash_and_cash_equivalents?.value ?? null,
          operatingCashFlow: cf.net_cash_flow_from_operating_activities?.value ?? null,
          freeCashFlow: cf.net_cash_flow?.value ?? null,
        }
      }) ?? []
    )
  } catch (e) {
    console.error("[Polygon] getFinancials error:", (e as Error).message)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analyst Ratings / Recommendations
// ─────────────────────────────────────────────────────────────────────────────

export type AnalystRating = {
  ticker: string
  targetPrice: number | null
  rating: string | null
  ratingBuy: number
  ratingSell: number
  ratingHold: number
  ratingStrongBuy: number
  ratingStrongSell: number
  updated: string
}

export async function getAnalystRatings(ticker: string): Promise<AnalystRating | null> {
  try {
    const data = await poly<{ results?: any[] }>(`/benzinga/v1/analyst-insights`, {
      ticker,
      limit: 50,
      sort: "last_updated.desc",
    })
    const latest = data.results?.[0]
    if (!latest) return null
    return {
      ticker,
      targetPrice: latest.price_target ?? null,
      rating: latest.rating ?? null,
      ratingBuy: 0,
      ratingSell: 0,
      ratingHold: 0,
      ratingStrongBuy: 0,
      ratingStrongSell: 0,
      updated: latest.last_updated ?? latest.date ?? "",
    }
  } catch {
    return null
  }
}

export async function getAnalystConsensus(ticker: string) {
  try {
    const data = await poly<{ results?: any[] }>(`/benzinga/v1/consensus-ratings/${ticker}`, {
      limit: 10,
    })
    return data.results ?? []
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dividends
// ─────────────────────────────────────────────────────────────────────────────

export type Dividend = {
  exDate: string
  payDate: string
  amount: number
  frequency: number
  type: string
}

export async function getDividends(ticker: string, limit = 12): Promise<Dividend[]> {
  try {
    const data = await poly<{ results?: any[] }>(
      `/v3/reference/dividends`,
      { ticker, limit, order: "desc", sort: "ex_dividend_date" }
    )
    return (
      data.results?.map((d) => ({
        exDate: d.ex_dividend_date ?? "",
        payDate: d.pay_date ?? "",
        amount: d.cash_amount ?? 0,
        frequency: d.frequency ?? 0,
        type: d.dividend_type ?? "",
      })) ?? []
    )
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Status
// ─────────────────────────────────────────────────────────────────────────────

export async function getMarketStatus(): Promise<{ market: string; serverTime: string; exchanges: Record<string, string> } | null> {
  try {
    const data = await poly<{ market?: string; serverTime?: string; exchanges?: any }>(`/v1/marketstatus/now`)
    return {
      market: data.market ?? "unknown",
      serverTime: data.serverTime ?? "",
      exchanges: data.exchanges ?? {},
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Related Companies
// ─────────────────────────────────────────────────────────────────────────────

export async function getRelatedTickers(ticker: string): Promise<string[]> {
  try {
    const data = await poly<{ results?: any[] }>(`/v1/related-companies/${ticker}`)
    return data.results?.map((r) => r.ticker) ?? []
  } catch {
    return []
  }
}
