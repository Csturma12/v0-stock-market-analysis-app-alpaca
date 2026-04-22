import { NextResponse } from "next/server"
import { getSubIndustry } from "@/lib/constants"
import { getTickerNews } from "@/lib/polygon"
import { getCompanyNews, getMarketNews } from "@/lib/finnhub"
import { tavilySearch } from "@/lib/tavily"

export const revalidate = 120

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sector = url.searchParams.get("sector") ?? ""
  const sub = url.searchParams.get("sub") ?? ""
  const ctx = getSubIndustry(sector, sub)
  if (!ctx?.sub) return NextResponse.json({ error: "not found" }, { status: 404 })

  const topTickers = ctx.sub.tickers.slice(0, 6)

  const [polyNews, finnhubNews, merger, tavily] = await Promise.all([
    Promise.all(topTickers.map((t) => getTickerNews(t, 5))).then((arr) => arr.flat()),
    Promise.all(topTickers.slice(0, 3).map((t) => getCompanyNews(t, 5))).then((arr) => arr.flat()),
    getMarketNews("merger"),
    tavilySearch(
      `${ctx.sub.name} sector news: mergers acquisitions analyst upgrades downgrades regulatory geopolitical macro ${topTickers.join(" ")}`,
      { topic: "news", maxResults: 8, days: 7 },
    ),
  ])

  // Normalize
  const items: Array<{
    id: string
    title: string
    source: string
    url: string
    publishedAt: string
    description?: string
    tickers?: string[]
    sentiment?: string
    image?: string
    origin: "polygon" | "finnhub" | "tavily"
  }> = []

  for (const n of polyNews) {
    items.push({
      id: `p-${n.id}`,
      title: n.title,
      source: n.publisher || "Polygon",
      url: n.url,
      publishedAt: n.publishedAt,
      description: n.description,
      tickers: n.tickers,
      sentiment: n.sentiment,
      image: n.imageUrl,
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
      description: n.summary,
      tickers: n.related ? n.related.split(",").slice(0, 5) : [],
      image: n.image,
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
      description: n.summary,
      tickers: n.related ? n.related.split(",").slice(0, 5) : [],
      image: n.image,
      origin: "finnhub",
    })
  }
  for (const r of tavily.results) {
    items.push({
      id: `t-${r.url}`,
      title: r.title,
      source: new URL(r.url).hostname.replace(/^www\./, ""),
      url: r.url,
      publishedAt: r.published_date ?? new Date().toISOString(),
      description: r.content?.slice(0, 280),
      origin: "tavily",
    })
  }

  // Dedupe by URL and sort desc by time
  const seen = new Set<string>()
  const deduped = items.filter((i) => {
    if (seen.has(i.url)) return false
    seen.add(i.url)
    return true
  })
  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return NextResponse.json({
    items: deduped.slice(0, 40),
    summary: tavily.answer ?? null,
    updatedAt: new Date().toISOString(),
  })
}
