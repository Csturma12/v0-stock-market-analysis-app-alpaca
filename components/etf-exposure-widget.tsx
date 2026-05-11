"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatPercent, formatLargeNumber } from "@/lib/format"

type Props = { symbol: string }
type EtfExp = {
  etfSymbol: string
  etfName: string
  weight: number
  shares: number
  marketValue: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EtfExposureWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const { data, isLoading, error } = useSWR<EtfExp[]>(
    `/api/uw/ticker/${symbol}/etf-exposure`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data ?? []
  const topRows = rows.slice(0, 15)
  const totalValue = rows.reduce((a, r) => a + r.marketValue, 0)

  return (
    <WidgetFrame
      title="ETF Exposure"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="chart" className="text-xs px-2 py-1">Chart</TabsTrigger>
            <TabsTrigger value="table" className="text-xs px-2 py-1">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">ETFs Holding</div>
          <div className="font-medium">{rows.length}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Total Value</div>
          <div className="font-medium">{formatLargeNumber(totalValue)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Top ETF</div>
          <div className="font-medium">{topRows[0]?.etfSymbol ?? "—"}</div>
        </div>
      </div>

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topRows.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 5, bottom: 5, left: 40 }}
            >
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <YAxis type="category" dataKey="etfSymbol" tick={{ fontSize: 10 }} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => formatPercent(v / 100)}
                labelFormatter={(l) => `ETF: ${l}`}
              />
              <Bar dataKey="weight" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[250px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">ETF</th>
                <th className="py-1 font-medium">Name</th>
                <th className="py-1 font-medium text-right">Weight</th>
                <th className="py-1 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 font-medium">{r.etfSymbol}</td>
                  <td className="py-1 truncate max-w-[120px]">{r.etfName}</td>
                  <td className="py-1 text-right">{formatPercent(r.weight / 100)}</td>
                  <td className="py-1 text-right">{formatLargeNumber(r.marketValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
