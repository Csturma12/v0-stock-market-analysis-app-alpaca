"use client"

import Link from "next/link"
import useSWR from "swr"
import { Flame, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Pattern = {
  symbol?: string
  ticker?: string
  pattern_name?: string
  pattern_type?: string
  autonomy_score?: number
  recommendation?: string
}

const FALLBACK = ["AMD", "NVDA", "SPY", "QQQ", "TSLA", "AAPL", "VST", "OXY", "RBLX", "VOO"]

export function HomeHotStocks() {
  const { data, isLoading } = useSWR<{ data: Pattern[] }>("/api/trading/patterns/top", fetcher, {
    refreshInterval: 120_000,
    shouldRetryOnError: false,
  })

  const patterns = data?.data ?? []
  const rows = patterns.length
    ? patterns.slice(0, 12).map((item) => ({
        symbol: (item.symbol ?? item.ticker ?? "").toUpperCase(),
        label: item.pattern_name ?? item.pattern_type ?? "Pattern",
        score: item.autonomy_score ?? 65,
        recommendation: item.recommendation ?? "watch",
      })).filter((item) => item.symbol)
    : FALLBACK.map((symbol, index) => ({
        symbol,
        label: "Momentum watch",
        score: 90 - index * 3,
        recommendation: "watch",
      }))

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Hot Today</span>
        </div>
        {isLoading && <span className="font-mono text-[9px] text-muted-foreground">Scanning...</span>}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1 overflow-y-auto p-1.5">
        {rows.map((row) => {
          const hot = row.score >= 80
          return (
            <Link
              key={row.symbol}
              href={`/ticker/${row.symbol}`}
              className="group rounded-md border border-border/50 bg-card/40 p-2 transition-colors hover:border-primary/60 hover:bg-muted/30"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-foreground group-hover:text-primary">{row.symbol}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold",
                    hot ? "bg-amber-500/15 text-amber-300" : "bg-muted text-muted-foreground",
                  )}
                >
                  {Math.round(row.score)}
                </span>
              </div>
              <p className="line-clamp-1 text-[10px] text-muted-foreground">{row.label}</p>
              <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase text-[color:var(--color-bull)]">
                <TrendingUp className="h-2.5 w-2.5" />
                {row.recommendation}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
