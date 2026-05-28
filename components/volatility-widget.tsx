"use client"

import { useState } from "react"
import useSWR from "swr"
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
import { cn } from "@/lib/utils"

type Props = { symbol: string }
type VolData = {
  date: string
  iv30: number | null
  hv30: number | null
  iv_rank?: number | null
  iv_percentile?: number | null
  term_structure?: { expiry: string; iv: number }[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—"
  return `${(v * 100).toFixed(1)}%`
}

export function VolatilityWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const { data, isLoading, error } = useSWR<{ data: VolData[]; source?: string }>(
    `/api/uw/ticker/${symbol}/volatility`,
    fetcher,
    { refreshInterval: 120_000 }
  )

  const rows = data?.data ?? []
  const latest = rows[0]
  const source = data?.source

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading volatility...
      </div>
    )
  }

  if (error || rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No volatility data
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-card p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Volatility {source === "flashalpha" && <span className="text-blue-400">(FlashAlpha)</span>}
        </span>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-6">
            <TabsTrigger value="chart" className="h-5 px-2 text-[10px]">Chart</TabsTrigger>
            <TabsTrigger value="table" className="h-5 px-2 text-[10px]">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats strip */}
      {latest && (
        <div className="mb-2 grid grid-cols-4 gap-1 text-center text-[10px]">
          <div className="rounded bg-muted/30 p-1">
            <div className="text-muted-foreground">IV30</div>
            <div className="font-mono font-semibold text-blue-400">
              {fmtPct(latest.iv30)}
            </div>
          </div>
          <div className="rounded bg-muted/30 p-1">
            <div className="text-muted-foreground">HV30</div>
            <div className="font-mono font-semibold text-amber-400">
              {fmtPct(latest.hv30)}
            </div>
          </div>
          <div className="rounded bg-muted/30 p-1">
            <div className="text-muted-foreground">IV Rank</div>
            <div className={cn(
              "font-mono font-semibold",
              (latest.iv_rank ?? 0) > 50 ? "text-red-400" : "text-green-400"
            )}>
              {latest.iv_rank != null ? `${latest.iv_rank.toFixed(0)}` : "—"}
            </div>
          </div>
          <div className="rounded bg-muted/30 p-1">
            <div className="text-muted-foreground">IV %ile</div>
            <div className={cn(
              "font-mono font-semibold",
              (latest.iv_percentile ?? 0) > 50 ? "text-red-400" : "text-green-400"
            )}>
              {latest.iv_percentile != null ? `${latest.iv_percentile.toFixed(0)}%` : "—"}
            </div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...rows].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v?.slice?.(5) ?? v} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 10, background: "#1a1a1a", border: "1px solid #333" }}
                formatter={(v: number) => [fmtPct(v), ""]}
              />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="iv30" name="IV30" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="hv30" name="HV30" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto text-[10px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium">IV30</th>
                <th className="py-1 text-right font-medium">HV30</th>
                <th className="py-1 text-right font-medium">Spread</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r, i) => {
                const spread = r.iv30 != null && r.hv30 != null ? r.iv30 - r.hv30 : null
                return (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-0.5">{r.date}</td>
                    <td className="py-0.5 text-right font-mono text-blue-400">{fmtPct(r.iv30)}</td>
                    <td className="py-0.5 text-right font-mono text-amber-400">{fmtPct(r.hv30)}</td>
                    <td className={cn(
                      "py-0.5 text-right font-mono",
                      spread != null && spread > 0 ? "text-red-400" : "text-green-400"
                    )}>
                      {spread != null ? `${spread > 0 ? "+" : ""}${(spread * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
