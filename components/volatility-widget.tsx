"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatPercent } from "@/lib/format"

type Props = { symbol: string }
type VolData = {
  date: string
  iv30: number | null
  iv60: number | null
  iv90: number | null
  hv30: number | null
  ivRank: number | null
  ivPercentile: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function VolatilityWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const { data, isLoading, error } = useSWR<{ data: VolData[] }>(
    `/api/uw/ticker/${symbol}/volatility`,
    fetcher,
    { refreshInterval: 120_000 }
  )

  const rows = data?.data ?? []
  const latest = rows[0]

  return (
    <WidgetFrame
      title="Volatility Analysis"
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
            <div className="text-muted-foreground">IV30</div>
            <div className="font-medium">{latest.iv30 ? formatPercent(latest.iv30) : "—"}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">HV30</div>
            <div className="font-medium">{latest.hv30 ? formatPercent(latest.hv30) : "—"}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">IV Rank</div>
            <div className="font-medium">{latest.ivRank ? formatPercent(latest.ivRank / 100) : "—"}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">IV %ile</div>
            <div className="font-medium">{latest.ivPercentile ? formatPercent(latest.ivPercentile / 100) : "—"}</div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...rows].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => formatPercent(v)}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="iv30" name="IV30" stroke="#3b82f6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="hv30" name="HV30" stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[250px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium text-right">IV30</th>
                <th className="py-1 font-medium text-right">HV30</th>
                <th className="py-1 font-medium text-right">IV Rank</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1">{r.date}</td>
                  <td className="py-1 text-right">{r.iv30 ? formatPercent(r.iv30) : "—"}</td>
                  <td className="py-1 text-right">{r.hv30 ? formatPercent(r.hv30) : "—"}</td>
                  <td className="py-1 text-right">{r.ivRank ? `${r.ivRank.toFixed(0)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
