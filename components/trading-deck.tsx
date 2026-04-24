"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  History,
  Target,
  Percent,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Trade = {
  id: string
  ticker: string
  side: "buy" | "sell"
  qty: number
  fill_price: number
  opened_at: string
  closed_at: string | null
  realized_pnl: number | null
  status: "open" | "closed" | "partial"
  mode: "paper" | "live"
  idea_id: string | null
}

type TradeIdea = {
  id: string
  ticker: string
  direction: string
  thesis: string
  conviction_score: number
  entry_price: number
  stop_loss: number
  take_profit: number
  status: string
  created_at: string
}

type StrategyStats = {
  strategy: string
  trades: number
  wins: number
  losses: number
  winRate: number
  totalPnl: number
  avgPnl: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

export function TradingDeck() {
  const [activeTab, setActiveTab] = useState<"history" | "pnl" | "strategy">("history")
  const [expanded, setExpanded] = useState(true)

  const { data: tradesData } = useSWR("/api/trading/trades", fetcher, { refreshInterval: 30_000 })
  const { data: ideasData } = useSWR("/api/trading/ideas", fetcher, { refreshInterval: 30_000 })

  const trades = (tradesData?.trades ?? []) as Trade[]
  const ideas = (ideasData?.ideas ?? []) as TradeIdea[]

  // Calculate P&L metrics
  const closedTrades = trades.filter((t) => t.status === "closed" && t.realized_pnl != null)
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)
  const wins = closedTrades.filter((t) => (t.realized_pnl ?? 0) > 0)
  const losses = closedTrades.filter((t) => (t.realized_pnl ?? 0) < 0)
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / losses.length) : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

  // Group by strategy (using direction as proxy for now)
  const strategyMap = new Map<string, Trade[]>()
  for (const t of closedTrades) {
    const idea = ideas.find((i) => i.id === t.idea_id)
    const strategy = idea?.direction ?? t.side
    if (!strategyMap.has(strategy)) strategyMap.set(strategy, [])
    strategyMap.get(strategy)!.push(t)
  }

  const strategyStats: StrategyStats[] = Array.from(strategyMap.entries()).map(([strategy, ts]) => {
    const w = ts.filter((t) => (t.realized_pnl ?? 0) > 0)
    const l = ts.filter((t) => (t.realized_pnl ?? 0) < 0)
    const total = ts.reduce((s, t) => s + (t.realized_pnl ?? 0), 0)
    const avgW = w.length > 0 ? w.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / w.length : 0
    const avgL = l.length > 0 ? Math.abs(l.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / l.length) : 0
    return {
      strategy,
      trades: ts.length,
      wins: w.length,
      losses: l.length,
      winRate: ts.length > 0 ? (w.length / ts.length) * 100 : 0,
      totalPnl: total,
      avgPnl: ts.length > 0 ? total / ts.length : 0,
      avgWin: avgW,
      avgLoss: avgL,
      profitFactor: avgL > 0 ? avgW / avgL : avgW > 0 ? Infinity : 0,
    }
  })

  const tabs = [
    { id: "history" as const, label: "Trade History", icon: History },
    { id: "pnl" as const, label: "P&L Tracking", icon: DollarSign },
    { id: "strategy" as const, label: "Strategy Performance", icon: BarChart3 },
  ]

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Trade Deck</h3>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {closedTrades.length} closed · {trades.filter((t) => t.status === "open").length} open
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border px-4 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            {activeTab === "history" && <TradeHistoryTab trades={trades} ideas={ideas} />}
            {activeTab === "pnl" && (
              <PnLTrackingTab
                totalPnl={totalPnl}
                winRate={winRate}
                wins={wins.length}
                losses={losses.length}
                avgWin={avgWin}
                avgLoss={avgLoss}
                profitFactor={profitFactor}
                trades={closedTrades}
              />
            )}
            {activeTab === "strategy" && <StrategyPerformanceTab stats={strategyStats} />}
          </div>
        </>
      )}
    </div>
  )
}

function TradeHistoryTab({ trades, ideas }: { trades: Trade[]; ideas: TradeIdea[] }) {
  const sorted = [...trades].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No trade history yet. Execute your first trade to start tracking.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <th className="pb-3 text-left">Ticker</th>
            <th className="pb-3 text-left">Side</th>
            <th className="pb-3 text-right">Qty</th>
            <th className="pb-3 text-right">Fill</th>
            <th className="pb-3 text-left">Opened</th>
            <th className="pb-3 text-left">Status</th>
            <th className="pb-3 text-right">P&L</th>
            <th className="pb-3 text-left">Idea</th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 20).map((t) => {
            const idea = ideas.find((i) => i.id === t.idea_id)
            const pnl = t.realized_pnl ?? 0
            const isWin = pnl > 0
            return (
              <tr key={t.id} className="border-t border-border/50 hover:bg-accent/30">
                <td className="py-3">
                  <Link href={`/ticker/${t.ticker}`} className="font-mono text-sm font-semibold hover:text-primary">
                    {t.ticker}
                  </Link>
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                      t.side === "buy"
                        ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]"
                        : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]"
                    )}
                  >
                    {t.side}
                  </span>
                </td>
                <td className="py-3 text-right font-mono text-sm tabular-nums">{t.qty}</td>
                <td className="py-3 text-right font-mono text-sm tabular-nums">${t.fill_price.toFixed(2)}</td>
                <td className="py-3 text-xs text-muted-foreground">
                  {new Date(t.opened_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                      t.status === "closed" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {t.status === "closed" ? (
                    <span
                      className={cn(
                        "font-mono text-sm font-medium tabular-nums",
                        isWin ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
                      )}
                    >
                      {isWin ? "+" : ""}${pnl.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3">
                  {idea ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                        idea.direction === "long"
                          ? "bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]"
                          : "bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]"
                      )}
                    >
                      {idea.direction === "long" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      AI
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Manual</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sorted.length > 20 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Showing 20 of {sorted.length} trades
        </p>
      )}
    </div>
  )
}

function PnLTrackingTab({
  totalPnl,
  winRate,
  wins,
  losses,
  avgWin,
  avgLoss,
  profitFactor,
  trades,
}: {
  totalPnl: number
  winRate: number
  wins: number
  losses: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  trades: Trade[]
}) {
  const isProfit = totalPnl >= 0

  // Daily P&L for chart
  const dailyPnl = new Map<string, number>()
  for (const t of trades) {
    if (!t.closed_at) continue
    const day = new Date(t.closed_at).toISOString().split("T")[0]
    dailyPnl.set(day, (dailyPnl.get(day) ?? 0) + (t.realized_pnl ?? 0))
  }
  const dailyEntries = Array.from(dailyPnl.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)

  // Cumulative P&L
  let cumulative = 0
  const cumulativeData = dailyEntries.map(([day, pnl]) => {
    cumulative += pnl
    return { day, pnl, cumulative }
  })

  const maxCumulative = Math.max(...cumulativeData.map((d) => Math.abs(d.cumulative)), 1)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total P&L"
          value={`${isProfit ? "+" : ""}$${totalPnl.toFixed(2)}`}
          color={isProfit ? "bull" : "bear"}
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtext={`${wins}W / ${losses}L`}
          color={winRate >= 50 ? "bull" : "bear"}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Win"
          value={`+$${avgWin.toFixed(2)}`}
          color="bull"
        />
        <StatCard
          icon={TrendingDown}
          label="Avg Loss"
          value={`-$${avgLoss.toFixed(2)}`}
          color="bear"
        />
      </div>

      {/* Profit factor */}
      <div className="flex items-center gap-4 rounded-md border border-border/60 bg-background px-4 py-3">
        <Percent className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Profit Factor</p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
          </p>
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          {profitFactor >= 2 ? "Excellent" : profitFactor >= 1.5 ? "Good" : profitFactor >= 1 ? "Break-even" : "Losing"}
        </p>
      </div>

      {/* Cumulative P&L chart (simple bar representation) */}
      {cumulativeData.length > 0 && (
        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Calendar className="mr-1 inline h-3 w-3" />
            Last 14 days cumulative P&L
          </h4>
          <div className="flex h-24 items-end gap-1">
            {cumulativeData.map(({ day, cumulative: c }) => {
              const height = Math.abs(c) / maxCumulative * 100
              const isUp = c >= 0
              return (
                <div
                  key={day}
                  className="group relative flex-1"
                  title={`${day}: ${isUp ? "+" : ""}$${c.toFixed(2)}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      isUp ? "bg-[color:var(--color-bull)]" : "bg-[color:var(--color-bear)]"
                    )}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{cumulativeData[0]?.day.slice(5)}</span>
            <span>{cumulativeData[cumulativeData.length - 1]?.day.slice(5)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function StrategyPerformanceTab({ stats }: { stats: StrategyStats[] }) {
  if (stats.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No strategy data yet. Complete some trades to see performance breakdowns.
      </div>
    )
  }

  const sorted = [...stats].sort((a, b) => b.totalPnl - a.totalPnl)

  return (
    <div className="space-y-4">
      {sorted.map((s) => {
        const isProfit = s.totalPnl >= 0
        return (
          <div
            key={s.strategy}
            className={cn(
              "rounded-md border p-4",
              isProfit ? "border-[color:var(--color-bull)]/30 bg-[color:var(--color-bull)]/5" : "border-[color:var(--color-bear)]/30 bg-[color:var(--color-bear)]/5"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.strategy === "long" ? (
                  <TrendingUp className="h-4 w-4 text-[color:var(--color-bull)]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[color:var(--color-bear)]" />
                )}
                <span className="font-mono text-sm font-semibold uppercase">{s.strategy}</span>
              </div>
              <span
                className={cn(
                  "font-mono text-lg font-bold tabular-nums",
                  isProfit ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
                )}
              >
                {isProfit ? "+" : ""}${s.totalPnl.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Trades</span>
                <p className="font-mono font-medium tabular-nums">{s.trades}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Win Rate</span>
                <p className="font-mono font-medium tabular-nums">{s.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Win</span>
                <p className="font-mono font-medium tabular-nums text-[color:var(--color-bull)]">
                  +${s.avgWin.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Loss</span>
                <p className="font-mono font-medium tabular-nums text-[color:var(--color-bear)]">
                  -${s.avgLoss.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Win rate bar */}
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-[color:var(--color-bull)]"
                  style={{ width: `${s.winRate}%` }}
                />
                <div
                  className="bg-[color:var(--color-bear)]"
                  style={{ width: `${100 - s.winRate}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>{s.wins}W</span>
                <span>{s.losses}L</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
  color: "bull" | "bear" | "neutral"
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/60 bg-background px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <span
        className={cn(
          "font-mono text-lg font-semibold tabular-nums",
          color === "bull" && "text-[color:var(--color-bull)]",
          color === "bear" && "text-[color:var(--color-bear)]"
        )}
      >
        {value}
      </span>
      {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  )
}
