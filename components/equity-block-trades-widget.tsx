"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmtCompact, fmtUsd, timeAgo } from "@/lib/format"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

type Props = { symbol?: string }
type Print = {
  executedAt: string
  price: number
  size: number
  premium: number
  marketCenter?: string
}
type Stats = {
  totalPremium: number
  totalSize: number
  blockCount: number
  blockPremium: number
  largest: Print | null
}
type ApiResponse = { prints: Print[]; stats: Stats | null }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EquityBlockTradesWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"all" | "blocks" | "chart">("all")
  const endpoint = symbol
    ? `/api/uw/ticker/${symbol}/dark-pool`
    : `/api/uw/dark-pool`

  const { data, isLoading, error } = useSWR<ApiResponse>(endpoint, fetcher, {
    refreshInterval: 60_000,
  })

  const prints = data?.prints ?? []
  const stats = data?.stats
  const blocks = prints.filter((p) => p.premium >= 500_000)

  // Aggregate by ticker for market-wide chart
  const tickerMap = new Map<string, number>()
  prints.forEach((p) => {
    const t = p.marketCenter ?? "UNK"
    tickerMap.set(t, (tickerMap.get(t) ?? 0) + p.premium)
  })
  const chartData = Array.from(tickerMap.entries())
    .map(([ticker, premium]) => ({ ticker, premium }))
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 12)

  const displayList = tab === "blocks" ? blocks : prints

  return (
    <WidgetFrame
      title={symbol ? "Dark Pool & Block Trades" : "Market Dark Pool"}
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs px-2 py-1">Blocks</TabsTrigger>
            <TabsTrigger value="chart" className="text-xs px-2 py-1">Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Total Vol</div>
            <div className="font-medium">{fmtCompact(stats.totalSize)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Premium</div>
            <div className="font-medium">{fmtCompact(stats.totalPremium)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Blocks</div>
            <div className="font-medium">{stats.blockCount} ({fmtCompact(stats.blockPremium)})</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Largest</div>
            <div className="font-medium">{stats.largest ? fmtCompact(stats.largest.premium) : "—"}</div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtCompact(v)} />
              <YAxis type="category" dataKey="ticker" tick={{ fontSize: 10 }} width={35} />
              <Tooltip formatter={(v: number) => fmtUsd(v, 0)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="premium" name="Premium">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#3b82f6" : "#64748b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[260px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Time</th>
                {!symbol && <th className="py-1 font-medium">Ticker</th>}
                <th className="py-1 font-medium text-right">Price</th>
                <th className="py-1 font-medium text-right">Size</th>
                <th className="py-1 font-medium text-right">Premium</th>
              </tr>
            </thead>
            <tbody>
              {displayList.slice(0, 50).map((p, i) => {
                const isBlock = p.premium >= 500_000
                return (
                  <tr key={i} className={`border-b border-border/50 ${isBlock ? "bg-primary/10" : ""}`}>
                    <td className="py-1">{timeAgo(p.executedAt)}</td>
                    {!symbol && <td className="py-1 font-medium">{p.marketCenter ?? "—"}</td>}
                    <td className="py-1 text-right">{fmtUsd(p.price)}</td>
                    <td className="py-1 text-right">{fmtCompact(p.size)}</td>
                    <td className="py-1 text-right font-medium">{fmtCompact(p.premium)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
