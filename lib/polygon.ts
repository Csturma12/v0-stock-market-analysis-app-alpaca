// Polygon.io REST client. Free tier: 5 req/min, 15-min delayed.
const BASE = "https://api.polygon.io"

function key() {
  const k = process.env.POLYGON_API_KEY
  if (!k) throw new Error("POLYGON_API_KEY is not set")
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

// Batched snapshot for sector/sub-industry heatmaps. Uses the grouped daily endpoint when possible,
// falls back to per-ticker snapshot calls. To stay under free-tier limits we serialize.
export async function getSnapshotBatch(tickers: string[]) {
  const out: Array<NonNullable<Awaited<ReturnType<typeof getSnapshot>>>> = []
  // Parallel with a small cap to avoid 429s on free tier.
  const CHUNK = 3
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const slice = tickers.slice(i, i + CHUNK)
    const results = await Promise.all(slice.map((t) => getSnapshot(t)))
    for (const r of results) if (r) out.push(r)
  }
  return out
}
