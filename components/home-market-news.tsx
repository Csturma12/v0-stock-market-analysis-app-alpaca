"use client"

import useSWR from "swr"
import { ExternalLink, Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTORS } from "@/lib/constants"
import { useMemo } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsItem = {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  sentiment?: "bullish" | "bearish" | "neutral"
  tickers?: string[]
}

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function SentimentIcon({ sentiment }: { sentiment?: string }) {
  if (sentiment === "bullish") return <TrendingUp className="h-3 w-3 text-[color:var(--color-bull)]" />
  if (sentiment === "bearish") return <TrendingDown className="h-3 w-3 text-[color:var(--color-bear)]" />
  return <Minus className="h-3 w-3 text-muted-foreground/40" />
}

export function HomeMarketNews() {
  // Get top trending tickers from all sectors (first 5 per sector)
  const trendingTickers = useMemo(() => {
    const tickers: string[] = []
    for (const sector of SECTORS) {
      for (const sub of sector.subIndustries) {
        for (const t of sub.tickers.slice(0, 3)) {
          if (!tickers.includes(t)) tickers.push(t)
        }
        if (tickers.length >= 30) break
      }
      if (tickers.length >= 30) break
    }
    return tickers
  }, [])

  const { data, isLoading } = useSWR<{ data: NewsItem[] }>(
    `/api/news?tickers=${trendingTickers.slice(0, 15).join(",")}&category=all`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const articles = data?.data ?? []

  if (isLoading) {
    return (
      <div className="flex h-full flex-col rounded-md border border-border/40 bg-card/50 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-3 py-2">
          <Newspaper className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Market News</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-border/40 bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Market News</span>
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] text-primary">
            {articles.length}
          </span>
        </div>
        <span className="font-mono text-[8px] text-muted-foreground/40">Trending stocks only</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {articles.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No recent news found
          </div>
        ) : (
          articles.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 border-b border-border/20 px-3 py-2 transition-colors hover:bg-muted/20 last:border-0"
            >
              {/* Sentiment icon */}
              <div className="mt-0.5 shrink-0">
                <SentimentIcon sentiment={item.sentiment} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-pretty text-[11px] font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
                  {item.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">
                    {item.source}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-mono text-[9px] text-muted-foreground/50">
                    {timeAgo(item.publishedAt)}
                  </span>
                  {item.sentiment && item.sentiment !== "neutral" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px font-mono text-[8px] uppercase tracking-widest",
                        item.sentiment === "bullish"
                          ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]"
                          : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                      )}
                    >
                      {item.sentiment}
                    </span>
                  )}
                  {item.tickers && item.tickers.length > 0 && (
                    <span className="font-mono text-[8px] text-muted-foreground/40">
                      {item.tickers.slice(0, 3).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors" />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
