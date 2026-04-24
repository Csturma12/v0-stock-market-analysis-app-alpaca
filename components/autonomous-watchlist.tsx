"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { TrendingUp, AlertCircle, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type PatternStock = {
  symbol: string
  pattern_name: string
  pattern_type: string
  autonomy_score: number
  frequency: "daily" | "weekly" | "monthly"
  win_rate: number
  avg_return: number
  recommendation: string
}

export function AutonomousWatchlist() {
  const [stocks, setStocks] = useState<PatternStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        // Fetch patterns for stocks with high autonomy scores
        const { data, error } = await fetch("/api/trading/patterns/top").then((r) => r.json())
        if (data) setStocks(data)
        if (error) console.log("[v0] Error:", error)
      } catch (err) {
        console.log("[v0] Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPatterns()
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground">Loading watchlist...</div>

  if (!stocks.length)
    return (
      <div className="rounded-lg border border-dashed bg-card/50 p-4 text-center">
        <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Search tickers to detect tradeable patterns</p>
      </div>
    )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Pattern Watchlist</h3>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{stocks.length} stocks</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {stocks.map((stock, idx) => (
          <PatternStockRow key={`${stock.symbol}-${idx}`} stock={stock} />
        ))}
      </div>
    </section>
  )
}

function PatternStockRow({ stock }: { stock: PatternStock }) {
  const isHighConfidence = stock.autonomy_score >= 70
  const isFrequentTrade = stock.frequency === "weekly" || stock.frequency === "monthly"

  return (
    <div
      className={cn(
        "rounded-md border p-2.5 transition-all hover:shadow-sm",
        isHighConfidence && isFrequentTrade
          ? "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/5"
          : "border-border bg-card/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="font-mono font-bold text-sm">{stock.symbol}</h4>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{stock.pattern_name}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{stock.recommendation}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Autonomy Score */}
          <div className="flex flex-col items-end">
            <div
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-mono font-bold",
                stock.autonomy_score >= 70
                  ? "bg-[color:var(--color-bull)]/20 text-[color:var(--color-bull)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {Math.round(stock.autonomy_score)}
            </div>
          </div>

          {/* Win Rate */}
          <div className="flex flex-col items-end text-[10px]">
            <span className="font-mono font-semibold">{stock.win_rate}%</span>
            <span className="text-muted-foreground">WR</span>
          </div>

          {/* Return */}
          <div className="flex flex-col items-end text-[10px]">
            <span className={cn("font-mono font-semibold", stock.avg_return > 0 ? "text-[color:var(--color-bull)]" : "text-red-500")}>
              {stock.avg_return > 0 ? "+" : ""}
              {stock.avg_return.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">Return</span>
          </div>

          {/* Frequency Badge */}
          <div
            className={cn(
              "rounded text-[9px] font-mono font-bold uppercase px-1.5 py-0.5",
              stock.frequency === "weekly"
                ? "bg-blue-500/20 text-blue-500"
                : stock.frequency === "monthly"
                  ? "bg-purple-500/20 text-purple-500"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {stock.frequency}
          </div>

          {/* Add to Watchlist Button */}
          <button className="rounded p-1 hover:bg-muted transition-colors" title="Add to watchlist">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
