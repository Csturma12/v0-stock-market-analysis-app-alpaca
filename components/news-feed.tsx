"use client"

import { useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsItem = {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  summary?: string
  tickers?: string[]
  sentiment?: "bullish" | "bearish" | "neutral"
  category?: string
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "news", label: "News" },
  { id: "ma", label: "M&A" },
  { id: "analyst", label: "Analyst" },
  { id: "social", label: "Social / Reddit" },
  { id: "macro", label: "Geopolitical / Macro" },
]

export function NewsFeed({ sectorId, tickers }: { sectorId: string; tickers: string[] }) {
  const [cat, setCat] = useState("all")
  const { data, isLoading } = useSWR<{ data: NewsItem[] }>(
    `/api/news?sector=${sectorId}&tickers=${tickers.join(",")}&category=${cat}`,
    fetcher,
    { refreshInterval: 120_000 },
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              cat === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading news and sentiment…
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(data?.data ?? []).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-pretty font-medium leading-snug group-hover:text-primary">{item.title}</h3>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {item.summary && <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{item.summary}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{item.source}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(item.publishedAt).toLocaleString()}
              </span>
              {item.sentiment && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
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
                </>
              )}
              {item.tickers && item.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tickers.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
        {!isLoading && (data?.data ?? []).length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No items found. Check that POLYGON_API_KEY, FINNHUB_API_KEY, and TAVILY_API_KEY are set.
          </div>
        )}
      </div>
    </div>
  )
}
