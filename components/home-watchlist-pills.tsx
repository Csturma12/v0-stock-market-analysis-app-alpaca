"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type WatchItem = {
  symbol: string
  pattern_name: string
  pattern_type: string
  autonomy_score: number
  win_rate: number
  avg_return: number
  recommendation: string
}

type Quote = {
  symbol: string
  latestPrice?: number
  changePercent?: number
}

export function HomeWatchlistPills() {
  const { data } = useSWR<{ data: WatchItem[] }>("/api/trading/patterns/top", fetcher, { refreshInterval: 60_000 })
  const items: WatchItem[] = data?.data ?? []
  const scrollRef = useRef<HTMLDivElement>(null)
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [isPaused, setIsPaused] = useState(false)

  // Fetch live quotes for each symbol
  useEffect(() => {
    if (!items.length) return
    const symbols = items.map((i) => i.symbol)
    Promise.all(
      symbols.map((sym) =>
        fetch(`/api/ticker/${sym}/quote`)
          .then((r) => r.json())
          .then((d) => ({ symbol: sym, latestPrice: d.latestPrice ?? d.price, changePercent: d.changePercent ?? d.dp }))
          .catch(() => ({ symbol: sym }))
      )
    ).then((results) => {
      const map: Record<string, Quote> = {}
      results.forEach((q) => { map[q.symbol] = q })
      setQuotes(map)
    })
  }, [items.length])

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return
    let frame: number
    const speed = 0.5 // px per frame

    const scroll = () => {
      if (!isPaused && el) {
        el.scrollLeft += speed
        // Reset to start when we've scrolled through the duplicated list
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0
        }
      }
      frame = requestAnimationFrame(scroll)
    }

    frame = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(frame)
  }, [isPaused, items.length])

  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-card/60 p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Watchlist</p>
        <p className="text-xs text-muted-foreground">No patterns tracked yet. Go to Trading to scan symbols.</p>
      </div>
    )
  }

  // Duplicate list for seamless loop
  const loopItems = [...items, ...items]

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Pattern Watchlist · {items.length} symbols
      </p>

      {/* Scrolling pill row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ scrollbarWidth: "none" }}
      >
        {loopItems.map((item, i) => {
          const q = quotes[item.symbol]
          const pct = q?.changePercent ?? null
          const price = q?.latestPrice ?? null
          const up = pct !== null ? pct >= 0 : null
          const score = item.autonomy_score

          return (
            <Link
              key={`${item.symbol}-${i}`}
              href={`/ticker/${item.symbol}`}
              className={cn(
                "flex shrink-0 flex-col gap-0.5 rounded-md border px-3 py-2 transition-colors hover:bg-muted/40",
                score >= 8
                  ? "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/5"
                  : score >= 6
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold">{item.symbol}</span>
                {price !== null && (
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    ${price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                  {item.pattern_name}
                </span>
                {pct !== null && (
                  <span className={cn("font-mono text-[10px] tabular-nums", up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
                    {up ? "+" : ""}{(pct * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Static scroll fallback for small lists */}
      {items.length < 4 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.symbol}
              href={`/ticker/${item.symbol}`}
              className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs hover:bg-muted/40"
            >
              {item.symbol}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
