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
  Cell,
} from "recharts"
import { formatNumber, formatPercent } from "@/lib/format"

type Props = { symbol: string }
type ShortData = {
  date: string
  shortInterest: number
  shortPercentFloat: number
  daysToCover: number
  shortRatio: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ShortInterestWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const { data, isLoading, error } = useSWR<ShortData[]>(
    `/api/uw/ticker/${symbol}/shorts`,
    fetcher,
    { refreshInterval: 300_000 }
  )

  const rows = data ?? []
  const latest = rows[0]

  return (
    <WidgetFrame
      title="Short Interest"
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
      {latest && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">SI</div>
            <div className="font-medium">{formatNumber(latest.shortInterest)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">% Float</div>
            <div className="font-medium">{formatPercent(latest.shortPercentFloat / 100)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Days Cover</div>
            <div className="font-medium">{latest.daysToCover.toFixed(1)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Ratio</div>
            <div className="font-medium">{latest.shortRatio.toFixed(2)}</div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...rows].slice(0, 26).reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => `${v.toFixed(2)}%`}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Bar dataKey="shortPercentFloat" name="% Float Short">
                {[...rows].slice(0, 26).reverse().map((entry, index) => {
                  const prev = index > 0 ? [...rows].slice(0, 26).reverse()[index - 1] : null
                  const isUp = prev ? entry.shortPercentFloat > prev.shortPercentFloat : false
                  return <Cell key={index} fill={isUp ? "#ef4444" : "#22c55e"} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[250px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium text-right">SI</th>
                <th className="py-1 font-medium text-right">% Float</th>
                <th className="py-1 font-medium text-right">Days</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 26).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1">{r.date}</td>
                  <td className="py-1 text-right">{formatNumber(r.shortInterest)}</td>
                  <td className="py-1 text-right">{r.shortPercentFloat.toFixed(2)}%</td>
                  <td className="py-1 text-right">{r.daysToCover.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
