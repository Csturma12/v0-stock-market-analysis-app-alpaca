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
import { formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

type FlowRow = {
  sector?: string
  etf?: string
  callPremium: number
  putPremium: number
  netPremium: number
  callVolume: number
  putVolume: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const GROUPS = ["sectors", "etfs"] as const
type Group = (typeof GROUPS)[number]

export function GroupFlowWidget() {
  const [group, setGroup] = useState<Group>("sectors")
  const [view, setView] = useState<"chart" | "table">("chart")

  const endpoint = group === "sectors" ? "/api/uw/sector-tide" : "/api/uw/etf-tide"
  const { data, isLoading, error } = useSWR<{ data: FlowRow[] }>(endpoint, fetcher, {
    refreshInterval: 60_000,
  })

  const rows = data?.data ?? []
  const chartData = rows.slice(0, 15).map((r) => ({
    name: r.sector ?? r.etf ?? "—",
    net: r.netPremium,
    callPrem: r.callPremium,
    putPrem: r.putPremium,
  }))

  const totalCall = rows.reduce((s, r) => s + r.callPremium, 0)
  const totalPut = rows.reduce((s, r) => s + r.putPremium, 0)
  const netTotal = totalCall - totalPut

  return (
    <WidgetFrame
      title="Group Flow (Sectors / ETFs)"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <div className="flex gap-2">
          <Tabs value={group} onValueChange={(v) => setGroup(v as Group)}>
            <TabsList className="h-7">
              <TabsTrigger value="sectors" className="text-xs px-2 py-1">Sectors</TabsTrigger>
              <TabsTrigger value="etfs" className="text-xs px-2 py-1">ETFs</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-7">
              <TabsTrigger value="chart" className="text-xs px-2 py-1">Chart</TabsTrigger>
              <TabsTrigger value="table" className="text-xs px-2 py-1">Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Call Premium</div>
          <div className="font-medium text-[color:var(--color-bull)]">{formatCompact(totalCall)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Put Premium</div>
          <div className="font-medium text-[color:var(--color-bear)]">{formatCompact(totalPut)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Net</div>
          <div className={cn("font-medium", netTotal >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {netTotal >= 0 ? "+" : ""}{formatCompact(netTotal)}
          </div>
        </div>
      </div>

      {view === "chart" ? (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => formatCompact(v)}
              />
              <Bar dataKey="net" name="Net Premium">
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.net >= 0 ? "var(--color-bull)" : "var(--color-bear)"} />
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
                <th className="py-1 font-medium">{group === "sectors" ? "Sector" : "ETF"}</th>
                <th className="py-1 font-medium text-right">Call $</th>
                <th className="py-1 font-medium text-right">Put $</th>
                <th className="py-1 font-medium text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const net = r.callPremium - r.putPremium
                return (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 font-medium">{r.sector ?? r.etf ?? "—"}</td>
                    <td className="py-1 text-right text-[color:var(--color-bull)]">{formatCompact(r.callPremium)}</td>
                    <td className="py-1 text-right text-[color:var(--color-bear)]">{formatCompact(r.putPremium)}</td>
                    <td className={cn("py-1 text-right font-medium", net >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
                      {net >= 0 ? "+" : ""}{formatCompact(net)}
                    </td>
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
