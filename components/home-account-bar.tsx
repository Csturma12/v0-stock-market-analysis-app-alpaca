"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet, Zap } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function HomeAccountBar() {
  const { data: accData } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const { data: posData } = useSWR("/api/trading/positions", fetcher, { refreshInterval: 15_000 })

  const acc = accData?.account
  const positions: { symbol: string; unrealized_pl: string; unrealized_plpc: string }[] = posData?.positions ?? []

  if (!acc || acc.error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading account...
      </div>
    )
  }

  const equity = Number(acc.equity ?? 0)
  const lastEquity = Number(acc.last_equity ?? 0)
  const dayPnl = equity - lastEquity
  const dayPct = lastEquity ? (dayPnl / lastEquity) * 100 : 0
  const up = dayPct >= 0
  const buyingPower = Number(acc.buying_power ?? 0)
  const cash = Number(acc.cash ?? 0)
  const totalUnrealized = positions.reduce((s, p) => s + Number(p.unrealized_pl ?? 0), 0)

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      <div className="flex flex-col gap-3">
        {/* Equity — large */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">Equity</span>
          </div>
          <span className="font-mono text-lg font-bold tabular-nums">{fmt(equity)}</span>
        </div>

        {/* Day P&L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {up ? <TrendingUp className="h-4 w-4 text-[color:var(--color-bull)]" /> : <TrendingDown className="h-4 w-4 text-[color:var(--color-bear)]" />}
            <span className="text-sm">Day P&L</span>
          </div>
          <span className={cn("font-mono text-sm font-semibold tabular-nums", up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {up ? "+" : ""}{fmt(dayPnl)} ({up ? "+" : ""}{dayPct.toFixed(2)}%)
          </span>
        </div>

        {/* Unrealized */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unrealized</span>
          <span className={cn("font-mono text-sm tabular-nums", totalUnrealized >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {totalUnrealized >= 0 ? "+" : ""}{fmt(totalUnrealized)}
          </span>
        </div>

        {/* Buying Power */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Buying Power</span>
          </div>
          <span className="font-mono text-sm tabular-nums">{fmt(buyingPower)}</span>
        </div>

        {/* Cash */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cash</span>
          <span className="font-mono text-sm tabular-nums">{fmt(cash)}</span>
        </div>

        {/* Open Positions */}
        <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-sm text-muted-foreground">Open Positions</span>
          <span className="font-mono text-lg font-bold">{positions.length}</span>
        </div>
      </div>
    </div>
  )
}
