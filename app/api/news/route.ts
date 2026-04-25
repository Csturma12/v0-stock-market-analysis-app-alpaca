import { NextResponse } from "next/server"
import { getSubIndustry, getSector } from "@/lib/constants"
import { getTheme, getThemeSubtopic } from "@/lib/themes"
import { getTickerNews } from "@/lib/polygon"
import { getCompanyNews, getMarketNews } from "@/lib/finnhub"
import { tavilySearch } from "@/lib/tavily"

// No static cache — each ticker request must be fresh
export const dynamic = "force-dynamic"

type NewsOut = {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  summary?: string
  description?: string
  tickers?: string[]
  sentiment?: "bullish" | "bearish" | "neutral" | string
  image?: string
  category?: string
  origin: "polygon" | "finnhub" | "tavily"
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sectorId = url.searchParams.get("sector") ?? ""
  const subId = url.searchParams.get("sub") ?? ""
  const themeId = url.searchParams.get("theme") ?? ""
  const tickersParam = url.searchParams.get("tickers") ?? ""
  const category = (url.searchParams.get("category") ?? "all").toLowerCase()

  // Resolve tickers and topic label
  let tickers: string[] = []
  let topicLabel = "US stock market"
  let themeQuery = ""

  if (tickersParam) {
    tickers = tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
    topicLabel = tickers.join(" ")
  } else if (themeId) {
    const theme = getTheme(themeId)
    if (theme) {
      tickers = theme.tickers.slice(0, 12)
      topicLabel = theme.name
      const sub = subId ? getThemeSubtopic(themeId, subId) : undefined
      themeQuery = sub ? sub.query : theme.rootQuery
    }
  } else {
    const ctx = getSubIndustry(sectorId, subId)
    if (ctx?.sub) {
      tickers = ctx.sub.tickers.slice(0, 6)
      topicLabel = `${ctx.sector.name} · ${ctx.sub.name}`
    } else {
      const sector = getSector(sectorId)
      if (sector) {
        const seen = new Set<string>()
        for (const s of sector.subIndustries) for (const t of s.tickers) if (seen.size < 10) seen.add(t)
        tickers = [...seen]
        topicLabel = sector.name
      }
    }
  }

  const topTickers = tickers.slice(0, 6)

  // Tavily query focused on requested category
  const catQuery: Record<string, string> = {
    ma: "mergers acquisitions deal announcement takeover",
    analyst: "analyst upgrade downgrade price target rating",
    social: "reddit stocktwits retail sentiment social media",
    macro: "geopolitical macro fed policy interest rates regulation",
    all: "news analyst mergers acquisitions regulatory",
    news: "news earnings guidance",
  }
  const queryExtra = catQuery[category] ?? catQuery.all
  // For themes, the theme query is more important than category keywords.
  const tavilyQuery = themeQuery
    ? `${topicLabel} ${themeQuery} ${topTickers.slice(0, 4).join(" ")}`
    : `${topicLabel} ${queryExtra} ${topTickers.join(" ")}`
  const tavilyMaxResults = themeId ? 14 : 8
  const tavilyDays = themeId ? 14 : 7

  // For single-ticker requests fetch more from each source for better coverage
  const isSingleTicker = tickers.length === 1
  const polyLimit = isSingleTicker ? 15 : 5
  const finnhubLimit = isSingleTicker ? 10 : 5

  const [polyNews, finnhubNews, merger, tav] = await Promise.all([
    Promise.all(topTickers.map((t) => getTickerNews(t, polyLimit))).then((arr) => arr.flat()),
    Promise.all(topTickers.slice(0, isSingleTicker ? 1 : 3).map((t) => getCompanyNews(t, finnhubLimit))).then((arr) => arr.flat()),
    category === "ma" || category === "all" ? getMarketNews("merger") : Promise.resolve([]),
    tavilySearch(tavilyQuery, {
      topic: "news",
      maxResults: isSingleTicker ? 10 : tavilyMaxResults,
      days: tavilyDays,
    }),
  ])

  const items: NewsOut[] = []

  for (const n of polyNews) {
    items.push({
      id: `p-${n.id}`,
      title: n.title,
      source: n.publisher || "Polygon",
      url: n.url,
      publishedAt: n.publishedAt,
      summary: n.description,
      description: n.description,
      tickers: n.tickers,
      sentiment: n.sentiment,
      image: n.imageUrl,
      category: "news",
      origin: "polygon",
    })
  }
  for (const n of finnhubNews) {
    items.push({
      id: `f-${n.id}`,
      title: n.headline,
      source: n.source,
      url: n.url,
      publishedAt: new Date(n.datetime * 1000).toISOString(),
      summary: n.summary,
      description: n.summary,
      tickers: n.related ? n.related.split(",").slice(0, 5) : [],
      image: n.image,
      category: "news",
      origin: "finnhub",
    })
  }
  for (const n of merger.slice(0, 8)) {
    items.push({
      id: `m-${n.id}`,
      title: n.headline,
      source: n.source,
      url: n.url,
      publishedAt: new Date(n.datetime * 1000).toISOString(),
      summary: n.summary,
      description: n.summary,
      tickers: n.related ? n.related.split(",").slice(0, 5) : [],
      image: n.image,
      category: "ma",
      origin: "finnhub",
    })
  }
  for (const r of tav.results) {
    items.push({
      id: `t-${r.url}`,
      title: r.title,
      source: (() => {
        try {
          return new URL(r.url).hostname.replace(/^www\./, "")
        } catch {
          return "web"
        }
      })(),
      url: r.url,
      publishedAt: r.published_date ?? new Date().toISOString(),
      summary: r.content?.slice(0, 280),
      description: r.content?.slice(0, 280),
      category: category === "all" ? "news" : category,
      origin: "tavily",
    })
  }

  // Filter by category if set (simple keyword matching)
  let filtered = items
  if (category !== "all") {
    const keywords: Record<string, RegExp> = {
      ma: /merg|acqui|takeover|buyout|deal/i,
      analyst: /analyst|upgrade|downgrade|price\s+target|rating|outperform|underperform/i,
      social: /reddit|stocktwits|twitter|x\.com|social|retail/i,
      macro: /fed|inflation|rates|geopolit|china|tariff|regulat|macro/i,
      news: /./,
    }
    const re = keywords[category]
    if (re) filtered = items.filter((i) => re.test(`${i.title} ${i.source} ${i.description ?? ""}`))
  }

  // Dedupe by URL
  const seen = new Set<string>()
  const deduped = filtered.filter((i) => {
    if (seen.has(i.url)) return false
    seen.add(i.url)
    return true
  })

  // Score by relevance: exact ticker mention in title scores highest, then recency
  const primaryTicker = tickers[0]?.toUpperCase() ?? ""
  const score = (item: NewsOut): number => {
    let s = 0
    // Recency: newer = higher score (ms since epoch, normalized)
    s += new Date(item.publishedAt).getTime() / 1e12
    if (primaryTicker) {
      const text = `${item.title} ${item.description ?? ""}`
      // Ticker appears in title/description
      if (text.toUpperCase().includes(primaryTicker)) s += 50
      // Ticker is in tickers array
      if (item.tickers?.map((t) => t.toUpperCase()).includes(primaryTicker)) s += 30
    }
    return s
  }
  deduped.sort((a, b) => score(b) - score(a))

  const out = deduped.slice(0, 40)
  return NextResponse.json({
    data: out,
    items: out,
    summary: tav.answer ?? null,
    updatedAt: new Date().toISOString(),
  })
}
