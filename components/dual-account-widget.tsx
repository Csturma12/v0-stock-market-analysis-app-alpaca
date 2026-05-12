"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { fmtUsd, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"
import { RefreshCw, TrendingUp, TrendingDown, Wallet, BarChart3, AlertCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Types for Alpaca
type AlpacaAccount = {
  id: string
  status: string
  cash: string
  portfolio_value: string
  buying_power: string
  equity: string
  last_equity: string
}

type AlpacaPosition = {
  symbol: string
  qty: string
  market_value: string
  avg_entry_price: string
  current_price: string
  unrealized_pl: string
  unrealized_plpc: string
  side: string
}

// Types for Webull
type WebullBalance = {
  account_id: string
  total_cash: number
  total_market_value: number
  net_liquidation: number
  buying_power: number
}

type WebullPosition = {
  symbol: string
  qty: number
  market_value: number
  avg_cost: number
  last_price: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  side: string
}

type AccountData = {
  account?: AlpacaAccount | null
  balance?: WebullBalance | null
  positions?: (AlpacaPosition | WebullPosition)[]
  error?: string
}

function AccountCard({
  title,
  badge,
  badgeVariant,
  equity,
  cash,
  buyingPower,
  dayPL,
  dayPLPct,
  isLoading,
  error,
  compact = false,
}: {
  title: string
  badge: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  equity: number | null
  cash: number | null
  buyingPower: number | null
  dayPL?: number | null
  dayPLPct?: number | null
  isLoading: boolean
  error?: string
  compact?: boolean
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className={cn("pb-2", compact && "px-3 py-2")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-sm font-medium text-muted-foreground", compact && "text-xs")}>{title}</CardTitle>
          <Badge variant={badgeVariant} className="text-[10px]">
            {badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "px-3 pb-3")}>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className={cn("space-y-3", compact && "space-y-1.5")}>
            <div>
              <div className={cn("text-2xl font-bold tabular-nums", compact && "text-base")}>
                {equity !== null ? fmtUsd(equity) : "—"}
              </div>
              {dayPL !== null && dayPLPct !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  dayPL >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {dayPL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{fmtUsd(dayPL)}</span>
                  <span>({fmtPct(dayPLPct)})</span>
                </div>
              )}
            </div>
            <div className={cn("grid grid-cols-2 gap-2 text-xs", compact && "gap-1 text-[10px]")}>
              <div className="flex min-w-0 items-center gap-1">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Cash</span>
                <span className="truncate font-medium tabular-nums">{cash !== null ? fmtUsd(cash) : "—"}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">BP</span>
                <span className="truncate font-medium tabular-nums">{buyingPower !== null ? fmtUsd(buyingPower) : "—"}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PositionsTable({ 
  positions, 
  isLoading 
}: { 
  positions: (AlpacaPosition | WebullPosition)[]
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Loading positions...
      </div>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No open positions
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 text-left font-medium">Symbol</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Avg Cost</th>
            <th className="py-2 text-right font-medium">Current</th>
            <th className="py-2 text-right font-medium">Mkt Value</th>
            <th className="py-2 text-right font-medium">P&L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => {
            // Handle both Alpaca and Webull position formats
            const symbol = p.symbol
            const qty = "qty" in p && typeof p.qty === "number" ? p.qty : Number((p as AlpacaPosition).qty)
            const avgCost = "avg_cost" in p ? p.avg_cost : Number((p as AlpacaPosition).avg_entry_price)
            const currentPrice = "last_price" in p ? p.last_price : Number((p as AlpacaPosition).current_price)
            const marketValue = "market_value" in p && typeof p.market_value === "number" 
              ? p.market_value 
              : Number((p as AlpacaPosition).market_value)
            const pnl = "unrealized_pnl" in p ? p.unrealized_pnl : Number((p as AlpacaPosition).unrealized_pl)
            const pnlPct = "unrealized_pnl_pct" in p ? p.unrealized_pnl_pct : Number((p as AlpacaPosition).unrealized_plpc)

            return (
              <tr key={`${symbol}-${i}`} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 font-medium">{symbol}</td>
                <td className="py-2 text-right tabular-nums">{qty}</td>
                <td className="py-2 text-right tabular-nums">{fmtUsd(avgCost)}</td>
                <td className="py-2 text-right tabular-nums">{fmtUsd(currentPrice)}</td>
                <td className="py-2 text-right tabular-nums">{fmtUsd(marketValue)}</td>
                <td className={cn(
                  "py-2 text-right tabular-nums",
                  pnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {fmtUsd(pnl)} ({fmtPct(pnlPct)})
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function DualAccountWidget({ compact = false }: { compact?: boolean }) {
  const [activeTab, setActiveTab] = useState<"overview" | "alpaca" | "webull">("overview")

  // Fetch Alpaca data
  const { data: alpacaAccount, isLoading: alpacaAccountLoading, error: alpacaAccountError } = useSWR<AccountData>(
    "/api/trading/account",
    fetcher,
    { refreshInterval: 30_000 }
  )
  const { data: alpacaPositions, isLoading: alpacaPositionsLoading } = useSWR<{ positions: AlpacaPosition[] }>(
    "/api/trading/positions",
    fetcher,
    { refreshInterval: 30_000 }
  )

  // Fetch Webull data
  const { data: webullAccount, isLoading: webullAccountLoading, error: webullAccountError } = useSWR<AccountData>(
    "/api/webull/account",
    fetcher,
    { refreshInterval: 30_000 }
  )
  const { data: webullPositions, isLoading: webullPositionsLoading } = useSWR<{ data: WebullPosition[] }>(
    "/api/webull/positions",
    fetcher,
    { refreshInterval: 30_000 }
  )

  // Parse Alpaca data
  const alpaca = alpacaAccount?.account
  const alpacaEquity = alpaca ? Number(alpaca.portfolio_value) : null
  const alpacaCash = alpaca ? Number(alpaca.cash) : null
  const alpacaBP = alpaca ? Number(alpaca.buying_power) : null
  const alpacaDayPL = alpaca ? Number(alpaca.equity) - Number(alpaca.last_equity) : null
  const alpacaDayPLPct = alpacaDayPL && alpaca ? alpacaDayPL / Number(alpaca.last_equity) : null

  // Parse Webull data
  const webull = webullAccount?.data?.balance ?? webullAccount?.balance
  const webullEquity = webull?.net_liquidation ?? null
  const webullCash = webull?.total_cash ?? null
  const webullBP = webull?.buying_power ?? null

  // Combined totals
  const totalEquity = (alpacaEquity ?? 0) + (webullEquity ?? 0)

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className={cn("pb-2", compact && "px-3 py-2")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-base font-semibold", compact && "text-sm")}>Trading Accounts</CardTitle>
          <div className="text-right">
            <div className={cn("text-lg font-bold tabular-nums", compact && "text-sm")}>{fmtUsd(totalEquity)}</div>
            <div className="text-[10px] text-muted-foreground">Combined Equity</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "px-3 pb-3")}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className={cn("grid w-full grid-cols-3 mb-4", compact && "mb-2 h-7")}>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="alpaca" className="text-xs">
              <span className="hidden sm:inline">Alpaca </span>Paper
            </TabsTrigger>
            <TabsTrigger value="webull" className="text-xs">
              <span className="hidden sm:inline">Webull </span>Live
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className={cn("space-y-4", compact && "mt-0 space-y-2")}>
            <div className={cn("grid gap-4 sm:grid-cols-2", compact && "gap-2 sm:grid-cols-1")}>
              <AccountCard
                title="Alpaca"
                badge="PAPER"
                badgeVariant="secondary"
                equity={alpacaEquity}
                cash={alpacaCash}
                buyingPower={alpacaBP}
                dayPL={alpacaDayPL}
                dayPLPct={alpacaDayPLPct}
                isLoading={alpacaAccountLoading}
                error={alpacaAccountError ? "Failed to load" : undefined}
                compact={compact}
              />
              <AccountCard
                title="Webull"
                badge="LIVE"
                badgeVariant="default"
                equity={webullEquity}
                cash={webullCash}
                buyingPower={webullBP}
                isLoading={webullAccountLoading}
                error={webullAccountError ? "Failed to load" : undefined}
                compact={compact}
              />
            </div>
          </TabsContent>

          <TabsContent value="alpaca">
            <AccountCard
              title="Alpaca Paper Trading"
              badge="PAPER"
              badgeVariant="secondary"
              equity={alpacaEquity}
              cash={alpacaCash}
              buyingPower={alpacaBP}
              dayPL={alpacaDayPL}
              dayPLPct={alpacaDayPLPct}
              isLoading={alpacaAccountLoading}
              error={alpacaAccountError ? "Failed to load Alpaca account" : undefined}
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Positions</h4>
              <PositionsTable
                positions={alpacaPositions?.positions ?? []}
                isLoading={alpacaPositionsLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="webull">
            <AccountCard
              title="Webull Live Trading"
              badge="LIVE"
              badgeVariant="default"
              equity={webullEquity}
              cash={webullCash}
              buyingPower={webullBP}
              isLoading={webullAccountLoading}
              error={webullAccountError ? "Failed to load Webull account" : undefined}
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Positions</h4>
              <PositionsTable
                positions={webullPositions?.data ?? []}
                isLoading={webullPositionsLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
