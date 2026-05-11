"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

type InsiderTrade = {
  ticker: string
  insiderName: string
  title: string
  tradeType: "buy" | "sell"
  shares: number
  price: number
  value: number
  filingDate: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MarketInsiderWidget() {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all")
  const { data, isLoading, error } = useSWR<{ data: InsiderTrade[] }>(
    "/api/uw/market-insider?limit=100",
    fetcher,
    { refreshInterval: 120_000 }
  )

  const allTrades = data?.data ?? []
  const trades = filter === "all" ? allTrades : allTrades.filter((t) => t.tradeType === filter)

  const totalBuy = allTrades.filter((t) => t.tradeType === "buy").reduce((s, t) => s + t.value, 0)
  const totalSell = allTrades.filter((t) => t.tradeType === "sell").reduce((s, t) => s + t.value, 0)

  return (
    <WidgetFrame
      title="Market-Wide Insider Trades"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
            <TabsTrigger value="buy" className="text-xs px-2 py-1">Buys</TabsTrigger>
            <TabsTrigger value="sell" className="text-xs px-2 py-1">Sells</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Buy Value</div>
          <div className="font-medium text-[color:var(--color-bull)]">{formatCompact(totalBuy)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Sell Value</div>
          <div className="font-medium text-[color:var(--color-bear)]">{formatCompact(totalSell)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Filings</div>
          <div className="font-medium">{allTrades.length}</div>
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Ticker</th>
              <th className="py-1 font-medium">Insider</th>
              <th className="py-1 font-medium">Type</th>
              <th className="py-1 font-medium text-right">Value</th>
              <th className="py-1 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 50).map((t, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-1">
                  <Link href={`/ticker/${t.ticker}`} className="font-medium text-primary hover:underline">
                    {t.ticker}
                  </Link>
                </td>
                <td className="py-1 truncate max-w-[120px]" title={`${t.insiderName} - ${t.title}`}>
                  {t.insiderName}
                </td>
                <td className="py-1">
                  <span className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                    t.tradeType === "buy" ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]" : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]"
                  )}>
                    {t.tradeType === "buy" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {t.tradeType}
                  </span>
                </td>
                <td className="py-1 text-right tabular-nums">{formatCompact(t.value)}</td>
                <td className="py-1 text-right text-muted-foreground">{t.filingDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
