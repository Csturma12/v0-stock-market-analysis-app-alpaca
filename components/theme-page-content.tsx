"use client"

import { useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import type { Theme } from "@/lib/themes"
import { TrendingTickers } from "@/components/trending-tickers"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsItem = {
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
}

const ACCENT_BORDER: Record<Theme["accent"], string> = {
  primary: "data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  bull: "data-[active=true]:border-[color:var(--color-bull)] data-[active=true]:bg-[color:var(--color-bull)] data-[active=true]:text-background",
  bear: "data-[active=true]:border-[color:var(--color-bear)] data-[active=true]:bg-[color:var(--color-bear)] data-[active=true]:text-background",
  warning: "data-[active=true]:border-amber-400 data-[active=true]:bg-amber-400 data-[active=true]:text-background",
}

export function ThemePageContent({ theme }: { theme: Theme }) {
  const [activeSub, setActiveSub] = useState<string>("")

  const newsUrl = `/api/news?theme=${theme.id}${activeSub ? `&sub=${activeSub}` : ""}`
  const { data, isLoading } = useSWR<{ data: NewsItem[]; summary: string | null }>(newsUrl, fetcher, {
    refreshInterval: 180_000,
  })

  const items = data?.data ?? []

  return (
    <div className="flex flex-col gap-10">
      {/* Sub-topic pills */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Filter by topic</h2>
        <div className="flex flex-wrap gap-1.5">
          <SubPill
            label="All topics"
            active={activeSub === ""}
            onClick={() => setActiveSub("")}
            accent={theme.accent}
          />
          {theme.subtopics.map((s) => (
            <SubPill
              key={s.id}
              label={s.name}
              active={activeSub === s.id}
              onClick={() => setActiveSub(s.id)}
              accent={theme.accent}
            />
          ))}
        </div>
      </section>

      {/* Curated tickers */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Theme Tickers</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {theme.tickers.length} names · Live snapshot
          </span>
        </div>
        <TrendingTickers tickers={theme.tickers} />
      </section>

      {/* Tavily AI summary if available */}
      {data?.summary && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            AI summary · past {activeSub ? "7" : "14"} days
          </h3>
          <p className="text-pretty text-sm leading-relaxed text-foreground">{data.summary}</p>
        </section>
      )}

      {/* News feed */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">
            {activeSub ? theme.subtopics.find((s) => s.id === activeSub)?.name : "Latest news"}
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Tavily + Polygon + Finnhub
          </span>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading news for {activeSub ? theme.subtopics.find((s) => s.id === activeSub)?.name : theme.name}…
          </div>
        )}

        <div className="flex flex-col gap-3">
          {items.map((item) => (
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
              {item.summary && (
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
              )}
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
                        item.sentiment === "bullish" &&
                          "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                        item.sentiment === "bearish" &&
                          "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                        item.sentiment === "neutral" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {String(item.sentiment)}
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
          {!isLoading && items.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No items found. Try a different sub-topic.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SubPill({
  label,
  active,
  onClick,
  accent,
}: {
  label: string
  active: boolean
  onClick: () => void
  accent: Theme["accent"]
}) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={cn(
        "rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
        ACCENT_BORDER[accent],
      )}
    >
      {label}
    </button>
  )
}
