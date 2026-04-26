"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet, Zap } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function HomeAccountBar({ compact = false }: { compact?: boolean }) {
  const { data: accData } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const { data: posData } = useSWR("/api/trading/positions", fetcher, { refreshInterval: 15_000 })

  const acc = accData?.account
  const positions: { symbol: string; unrealized_pl: string; unrealized_plpc: string }[] = posData?.positions ?? []

  if (!acc || acc.error) return null

  const equity = Number(acc.equity ?? 0)
  const lastEquity = Number(acc.last_equity ?? 0)
  const dayPnl = equity - lastEquity
  const dayPct = lastEquity ? (dayPnl / lastEquity) * 100 : 0
  const up = dayPct >= 0

  // Compact mode — single row for header
  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-md border border-border/50 bg-card/40 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[10px] text-muted-foreground">Equity</span>
          <span className="font-mono text-xs font-semibold tabular-nums">{fmt(equity)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {up ? <TrendingUp className="h-3 w-3 text-[color:var(--color-bull)]" /> : <TrendingDown className="h-3 w-3 text-[color:var(--color-bear)]" />}
          <span className={cn("font-mono text-xs font-semibold tabular-nums", up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {up ? "+" : ""}{fmt(dayPnl)} ({up ? "+" : ""}{dayPct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">Positions</span>
          <span className="font-mono text-xs font-semibold">{positions.length}</span>
        </div>
      </div>
    )
  }

  const buyingPower = Number(acc.buying_power ?? 0)
  const cash = Number(acc.cash ?? 0)
  const totalUnrealized = positions.reduce((s, p) => s + Number(p.unrealized_pl ?? 0), 0)

  return (
    <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Paper Account
      </p>
      <div className="flex flex-col gap-2.5">
        {/* Equity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="h-3 w-3" />
            <span className="text-xs">Equity</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">{fmt(equity)}</span>
        </div>

        {/* Day P&L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-xs">Day P&amp;L</span>
          </div>
          <span className={cn("font-mono text-sm font-semibold tabular-nums", up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {up ? "+" : ""}{fmt(dayPnl)} ({up ? "+" : ""}{dayPct.toFixed(2)}%)
          </span>
        </div>

        {/* Unrealized P&L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs">Unrealized</span>
          </div>
          <span className={cn("font-mono text-sm tabular-nums", totalUnrealized >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {totalUnrealized >= 0 ? "+" : ""}{fmt(totalUnrealized)}
          </span>
        </div>

        {/* Buying Power */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span className="text-xs">Buying Power</span>
          </div>
          <span className="font-mono text-sm tabular-nums">{fmt(buyingPower)}</span>
        </div>

        {/* Cash */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs">Cash</span>
          </div>
          <span className="font-mono text-sm tabular-nums">{fmt(cash)}</span>
        </div>

        {/* Open Positions count */}
        <div className="mt-0.5 flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Open Positions</span>
          <span className="font-mono text-sm font-semibold">{positions.length}</span>
        </div>
      </div>
    </div>
  )
}
