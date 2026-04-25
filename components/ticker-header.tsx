"use client"

import useSWR from "swr"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsItem = {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  sentiment?: "bullish" | "bearish" | "neutral"
}

export function TickerHeader({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher, { refreshInterval: 30_000 })
  const { data: newsData } = useSWR<{ data: NewsItem[] }>(
    `/api/news?tickers=${symbol}&category=all`,
    fetcher,
    { refreshInterval: 120_000 },
  )

  const snap = data?.snapshot
  const profile = data?.profile
  const price = snap?.price ?? null
  const changePct = snap?.changePct ?? null
  const up = changePct != null && changePct >= 0
  const news = newsData?.data ?? []

  return (
    <header className="flex h-14 w-full items-center gap-0 overflow-hidden rounded-lg border border-border bg-card">
      {/* ── Ticker info (compact left column) ── */}
      <div className="flex shrink-0 items-center gap-3 px-3">
        {profile?.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo}
            alt={`${symbol} logo`}
            className="h-7 w-7 rounded bg-background object-contain p-0.5"
          />
        )}
        <div className="flex flex-col justify-center leading-none">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {profile?.exchange ?? "—"}
          </span>
          <span className="font-semibold tracking-tight">
            {symbol}
            {profile?.name && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {profile.name}
              </span>
            )}
          </span>
        </div>

        {/* Price */}
        <span className="ml-2 font-mono text-lg font-semibold tabular-nums">
          {fmtPrice(price)}
        </span>

        {/* Day change */}
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            changePct == null && "text-muted-foreground",
            changePct != null && up && "text-[color:var(--color-bull)]",
            changePct != null && !up && "text-[color:var(--color-bear)]",
          )}
        >
          {changePct == null ? "—" : (up ? "+" : "") + fmtPct(changePct)}
        </span>

        {/* Mkt cap */}
        {profile?.marketCapitalization && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            ${(profile.marketCapitalization / 1000).toFixed(2)}B
          </span>
        )}
      </div>

      {/* ── 0.5px divider ── */}
      <div className="h-full w-px shrink-0 bg-border" style={{ minWidth: "0.5px", maxWidth: "0.5px" }} />

      {/* ── Scrolling news marquee (fills remaining space) ── */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        {news.length === 0 ? (
          <span className="px-4 font-mono text-xs text-muted-foreground">Loading news…</span>
        ) : (
          <div className="news-marquee flex items-center whitespace-nowrap">
            {/* Duplicate the list so the loop is seamless */}
            {[...news, ...news].map((item, i) => (
              <a
                key={`${item.id}-${i}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex shrink-0 items-center gap-2 px-5 hover:text-foreground"
              >
                {item.sentiment && (
                  <span
                    className={cn(
                      "shrink-0 rounded-sm px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                      item.sentiment === "bullish" &&
                        "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                      item.sentiment === "bearish" &&
                        "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                      item.sentiment === "neutral" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.sentiment}
                  </span>
                )}
                <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {item.title}
                </span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0 text-muted-foreground/50" />
                <span className="ml-3 text-muted-foreground/30">·</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
