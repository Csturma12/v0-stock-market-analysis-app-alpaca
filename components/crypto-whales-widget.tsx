"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

type Whale = {
  symbol: string
  side: "buy" | "sell"
  size: number
  premium: number
  strike?: number
  expiry?: string
  time: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CryptoWhalesWidget() {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all")
  const { data, isLoading, error } = useSWR<{ data: Whale[] }>(
    "/api/uw/crypto-whales",
    fetcher,
    { refreshInterval: 60_000 }
  )

  const allWhales = data?.data ?? []
  const whales = filter === "all" ? allWhales : allWhales.filter((w) => w.side === filter)

  const totalBuy = allWhales.filter((w) => w.side === "buy").reduce((s, w) => s + w.premium, 0)
  const totalSell = allWhales.filter((w) => w.side === "sell").reduce((s, w) => s + w.premium, 0)

  return (
    <WidgetFrame
      title="Crypto Whale Trades"
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
          <div className="text-muted-foreground">Buy Premium</div>
          <div className="font-medium text-[color:var(--color-bull)]">{formatCompact(totalBuy)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Sell Premium</div>
          <div className="font-medium text-[color:var(--color-bear)]">{formatCompact(totalSell)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Trades</div>
          <div className="font-medium">{allWhales.length}</div>
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Symbol</th>
              <th className="py-1 font-medium">Side</th>
              <th className="py-1 font-medium text-right">Premium</th>
              <th className="py-1 font-medium text-right">Size</th>
              <th className="py-1 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {whales.slice(0, 50).map((w, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1 font-medium">{w.symbol}</td>
                <td className="py-1">
                  <span className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                    w.side === "buy" ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]" : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]"
                  )}>
                    {w.side === "buy" ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {w.side}
                  </span>
                </td>
                <td className="py-1 text-right tabular-nums">{formatCompact(w.premium)}</td>
                <td className="py-1 text-right tabular-nums">{formatCompact(w.size)}</td>
                <td className="py-1 text-right text-muted-foreground">{w.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
