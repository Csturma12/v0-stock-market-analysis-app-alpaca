"use client"

import useSWR from "swr"
import { ExternalLink, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsItem = {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  summary?: string
  sentiment?: "bullish" | "bearish" | "neutral"
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function TickerNews({ symbol }: { symbol: string }) {
  // SWR key includes the uppercased symbol — changing ticker = new key = immediate refetch
  const { data, isLoading } = useSWR<{ data: NewsItem[] }>(
    symbol ? `/api/news?tickers=${symbol.toUpperCase()}&category=all` : null,
    fetcher,
    {
      revalidateOnMount: true,    // always fetch fresh on mount/symbol change
      revalidateOnFocus: false,
      dedupingInterval: 30_000,   // same symbol re-requested within 30s uses cache
    }
  )

  const articles = (data?.data ?? []).slice(0, 10)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading news...</p>
      </div>
    )
  }

  if (!articles.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">No news found.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border/40 bg-background">
      {/* Header pill */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Newspaper className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Top Stories
          </span>
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] text-primary">
            {articles.length}
          </span>
        </div>
        <span className="font-mono text-[9px] text-muted-foreground/40">Polygon · Tavily</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {articles.map((item, idx) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-2 border-b border-border/30 px-3 py-2 transition-colors hover:bg-muted/30 last:border-b-0"
          >
            {/* Rank badge */}
            <span className="mt-0.5 shrink-0 font-mono text-[9px] text-muted-foreground/30 w-3 text-right leading-snug">
              {idx + 1}
            </span>

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
              </div>
            </div>

            <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  )
}
