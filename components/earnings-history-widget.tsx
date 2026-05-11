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
  ReferenceLine,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/format"

type Props = { symbol: string }
type Earnings = {
  reportDate: string
  fiscalQuarter: string
  epsEstimate: number | null
  epsActual: number | null
  epsSurprise: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  priceMove: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EarningsHistoryWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const { data, isLoading, error } = useSWR<Earnings[]>(
    `/api/uw/ticker/${symbol}/earnings`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data ?? []

  // Calculate stats
  const withMove = rows.filter((r) => r.priceMove !== null)
  const avgMove = withMove.length > 0 ? withMove.reduce((a, r) => a + Math.abs(r.priceMove!), 0) / withMove.length : 0
  const beatCount = rows.filter((r) => r.epsSurprise !== null && r.epsSurprise > 0).length
  const beatRate = rows.length > 0 ? beatCount / rows.length : 0

  return (
    <WidgetFrame
      title="Earnings History"
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
          <div className="text-muted-foreground">Beat Rate</div>
          <div className="font-medium">{formatPercent(beatRate)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Avg Move</div>
          <div className="font-medium">{avgMove.toFixed(1)}%</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Reports</div>
          <div className="font-medium">{rows.length}</div>
        </div>
      </div>

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...rows].slice(0, 12).reverse()}
              margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            >
              <XAxis dataKey="fiscalQuarter" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
                labelFormatter={(l) => `Quarter: ${l}`}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Bar dataKey="priceMove" name="Post-Earnings Move">
                {[...rows].slice(0, 12).reverse().map((entry, index) => (
                  <Cell key={index} fill={entry.priceMove && entry.priceMove >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
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
                <th className="py-1 font-medium">Qtr</th>
                <th className="py-1 font-medium text-right">EPS Est</th>
                <th className="py-1 font-medium text-right">EPS Act</th>
                <th className="py-1 font-medium text-right">Move</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 16).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1">{r.reportDate.slice(0, 10)}</td>
                  <td className="py-1">{r.fiscalQuarter}</td>
                  <td className="py-1 text-right">{r.epsEstimate !== null ? formatCurrency(r.epsEstimate) : "—"}</td>
                  <td className="py-1 text-right">{r.epsActual !== null ? formatCurrency(r.epsActual) : "—"}</td>
                  <td className={`py-1 text-right ${r.priceMove && r.priceMove >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {r.priceMove !== null ? `${r.priceMove > 0 ? "+" : ""}${r.priceMove.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
