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
  const { data, isLoading } = useSWR<{ data: NewsItem[] }>(
    `/api/news?tickers=${symbol}&category=all`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5">
          <Newspaper className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top 10 Stories</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/50">Polygon · Tavily</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-border/50">
          {articles.map((item, idx) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2.5 px-1 py-2.5 transition-colors hover:bg-muted/40"
            >
              {/* Index number */}
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground/40 w-4 text-right">
                {idx + 1}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-pretty text-xs font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
                  {item.title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.source}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {timeAgo(item.publishedAt)}
                  </span>
                  {item.sentiment && item.sentiment !== "neutral" && (
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-widest",
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

              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
