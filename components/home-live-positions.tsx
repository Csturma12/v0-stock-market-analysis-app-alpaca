"use client"

import { useEffect, useState } from "react"
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

type Position = {
  symbol: string
  qty: number
  avg_fill_price: number
  current_price: number
  market_value: number
  unrealized_pl: number
  unrealized_plpc: number
  side: "long" | "short"
}

export function HomeLivePositions() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPositions() {
      try {
        const res = await fetch("/api/trading/positions")
        if (res.ok) {
          const data = await res.json()
          setPositions(data.positions || [])
        }
      } catch (err) {
        console.error("[v0] Failed to load positions:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
    const interval = setInterval(loadPositions, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-40 animate-pulse rounded bg-muted/20" />
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">No open positions</p>
      </div>
    )
  }

  const totalPL = positions.reduce((sum, p) => sum + p.unrealized_pl, 0)
  const totalValue = positions.reduce((sum, p) => sum + p.market_value, 0)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-sm uppercase tracking-widest text-foreground">
          Open Positions ({positions.length})
        </h3>
        <span className={`font-mono text-xs font-semibold ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
          {totalPL >= 0 ? "+" : ""}{totalPL.toFixed(2)}
        </span>
      </div>

      {/* Summary row */}
      <div className="text-xs text-muted-foreground font-mono">
        Total Market Value: <span className="text-foreground">${totalValue.toFixed(2)}</span>
      </div>

      {/* Positions list */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {positions.map((pos) => {
          const isGain = pos.unrealized_pl >= 0
          return (
            <Link
              key={pos.symbol}
              href={`/ticker/${pos.symbol}`}
              className="group flex items-center justify-between gap-2 rounded-md border border-transparent bg-muted/20 px-3 py-2 transition-colors hover:border-border hover:bg-muted/40"
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="font-mono font-semibold text-sm">{pos.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  {pos.qty} @ ${pos.avg_fill_price.toFixed(2)}
                </div>
              </div>
              <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
                <div className={`text-xs font-semibold ${isGain ? "text-green-400" : "text-red-400"}`}>
                  {isGain ? "+" : ""}{pos.unrealized_pl.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isGain ? "+" : ""}{(pos.unrealized_plpc * 100).toFixed(2)}%
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )
        })}
      </div>

      {/* View trading page link */}
      <Link
        href="/trading"
        className="text-xs font-mono uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mt-2"
      >
        View all in trading →
      </Link>
    </div>
  )
}
