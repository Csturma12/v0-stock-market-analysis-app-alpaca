// Finnhub REST client. Free tier: 60 req/min.
const BASE = "https://finnhub.io/api/v1"

function key() {
  const k = process.env.FINNHUB_API_KEY
  if (!k) throw new Error("FINNHUB_API_KEY is not set")
  return k
}

async function fh<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  url.searchParams.set("token", key())
  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Finnhub ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export async function getQuote(symbol: string) {
  try {
    const d = await fh<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number }>(
      "/quote",
      { symbol },
    )
    if (!d.c) return null
    return {
      symbol,
      price: d.c,
      change: d.d,
      changePct: d.dp,
      high: d.h,
      low: d.l,
      open: d.o,
      prevClose: d.pc,
    }
  } catch {
    return null
  }
}

export async function getCompanyProfile(symbol: string) {
  try {
    const d = await fh<any>("/stock/profile2", { symbol })
    if (!d.ticker) return null
    return {
      ticker: d.ticker,
      name: d.name,
      country: d.country,
      currency: d.currency,
      exchange: d.exchange,
      ipo: d.ipo,
      marketCap: d.marketCapitalization,
      shareOutstanding: d.shareOutstanding,
      industry: d.finnhubIndustry,
      logo: d.logo,
      weburl: d.weburl,
    }
  } catch {
    return null
  }
}

export async function getBasicFinancials(symbol: string) {
  try {
    const d = await fh<{ metric?: Record<string, number | null> }>("/stock/metric", {
      symbol,
      metric: "all",
    })
    return d.metric ?? {}
  } catch {
    return {}
  }
}

export async function getRecommendationTrends(symbol: string) {
  try {
    const d = await fh<Array<{ buy: number; hold: number; sell: number; strongBuy: number; strongSell: number; period: string }>>(
      "/stock/recommendation",
      { symbol },
    )
    return d ?? []
  } catch {
    return []
  }
}

export async function getPriceTarget(symbol: string) {
  try {
    const d = await fh<{ targetHigh: number; targetLow: number; targetMean: number; targetMedian: number; lastUpdated: string }>(
      "/stock/price-target",
      { symbol },
    )
    return d
  } catch {
    return null
  }
}

export async function getInsiderSentiment(symbol: string) {
  try {
    const from = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const to = new Date().toISOString().slice(0, 10)
    const d = await fh<{ data?: Array<{ year: number; month: number; mspr: number; change: number }> }>(
      "/stock/insider-sentiment",
      { symbol, from, to },
    )
    return d.data ?? []
  } catch {
    return []
  }
}

export async function getCompanyNews(symbol: string, days = 7) {
  try {
    const from = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const to = new Date().toISOString().slice(0, 10)
    const d = await fh<Array<{ id: number; headline: string; summary: string; url: string; image: string; source: string; datetime: number; related: string }>>(
      "/company-news",
      { symbol, from, to },
    )
    return d ?? []
  } catch {
    return []
  }
}

export async function getMarketNews(category: "general" | "forex" | "crypto" | "merger" = "general") {
  try {
    const d = await fh<Array<{ id: number; headline: string; summary: string; url: string; image: string; source: string; datetime: number; related: string; category: string }>>(
      "/news",
      { category },
    )
    return d ?? []
  } catch {
    return []
  }
}
