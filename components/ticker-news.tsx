"use client"

import useSWR from "swr"
import { ExternalLink } from "lucide-react"
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

export function TickerNews({ symbol }: { symbol: string }) {
  const { data } = useSWR<{ data: NewsItem[] }>(`/api/news?tickers=${symbol}&category=all`, fetcher)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">News &amp; Web Intelligence</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Polygon + Tavily</span>
      </div>
      <div className="flex flex-col gap-3">
        {(data?.data ?? []).slice(0, 12).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-1.5 rounded-md border border-border/60 bg-background p-3 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-pretty text-sm font-medium leading-snug group-hover:text-primary">{item.title}</h4>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {item.source}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(item.publishedAt).toLocaleDateString()}
              </span>
              {item.sentiment && (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                    item.sentiment === "bullish" && "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                    item.sentiment === "bearish" && "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                    item.sentiment === "neutral" && "bg-muted text-muted-foreground",
                  )}
                >
                  {item.sentiment}
                </span>
              )}
            </div>
          </a>
        ))}
        {(data?.data ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground">No news yet.</div>
        )}
      </div>
    </div>
  )
}
