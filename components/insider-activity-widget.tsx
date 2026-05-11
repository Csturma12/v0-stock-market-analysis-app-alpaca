"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatLargeNumber } from "@/lib/format"

type Props = { symbol: string }
type Insider = {
  executedAt: string
  insiderName: string
  insiderTitle: string
  transactionType: "BUY" | "SELL" | "OTHER"
  shares: number
  price: number
  value: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function InsiderActivityWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"all" | "buys" | "sells">("all")
  const { data, isLoading, error } = useSWR<{ data: Insider[] }>(
    `/api/uw/ticker/${symbol}/insider`,
    fetcher,
    { refreshInterval: 300_000 }
  )

  const rows = data?.data ?? []
  const filtered = tab === "all" ? rows : rows.filter((r) => r.transactionType === (tab === "buys" ? "BUY" : "SELL"))

  // Stats
  const buys = rows.filter((r) => r.transactionType === "BUY")
  const sells = rows.filter((r) => r.transactionType === "SELL")
  const buyValue = buys.reduce((a, r) => a + r.value, 0)
  const sellValue = sells.reduce((a, r) => a + r.value, 0)

  return (
    <WidgetFrame
      title="Insider Activity"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
            <TabsTrigger value="buys" className="text-xs px-2 py-1">Buys</TabsTrigger>
            <TabsTrigger value="sells" className="text-xs px-2 py-1">Sells</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Buy Txns</div>
          <div className="font-medium text-green-500">{buys.length}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Buy Value</div>
          <div className="font-medium text-green-500">{formatLargeNumber(buyValue)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Sell Txns</div>
          <div className="font-medium text-red-500">{sells.length}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Sell Value</div>
          <div className="font-medium text-red-500">{formatLargeNumber(sellValue)}</div>
        </div>
      </div>

      <div className="max-h-[250px] overflow-y-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Name</th>
              <th className="py-1 font-medium">Type</th>
              <th className="py-1 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1">{r.executedAt.slice(0, 10)}</td>
                <td className="py-1 truncate max-w-[100px]" title={r.insiderTitle}>{r.insiderName}</td>
                <td className={`py-1 ${r.transactionType === "BUY" ? "text-green-500" : r.transactionType === "SELL" ? "text-red-500" : ""}`}>
                  {r.transactionType}
                </td>
                <td className="py-1 text-right">{formatCurrency(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
