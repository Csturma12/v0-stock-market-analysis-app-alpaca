"use client"

import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { fmtCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Target } from "lucide-react"

type GEXData = {
  symbol: string
  date: string
  gex: number | null
  call_gex: number | null
  put_gex: number | null
  gex_flip: number | null
  dex: number | null
  call_dex: number | null
  put_dex: number | null
  vex: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Props = { symbol: string }

export function GexWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"overview" | "chart">("overview")

  const { data, isLoading, error } = useSWR<{ data: GEXData | null }>(
    `/api/fa/ticker/${symbol}/gex`,
    fetcher,
    { refreshInterval: 120_000 }
  )

  const gex = data?.data

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading GEX...
      </div>
    )
  }

  if (error || !gex) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        GEX data unavailable
      </div>
    )
  }

  // Chart data for gamma exposure breakdown
  const chartData = [
    { name: "Call GEX", value: gex.call_gex ?? 0 },
    { name: "Put GEX", value: gex.put_gex ?? 0 },
    { name: "Net GEX", value: gex.gex ?? 0 },
  ]

  const deltaData = [
    { name: "Call DEX", value: gex.call_dex ?? 0 },
    { name: "Put DEX", value: gex.put_dex ?? 0 },
    { name: "Net DEX", value: gex.dex ?? 0 },
  ]

  const isPositiveGex = (gex.gex ?? 0) > 0

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-card p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Greek Exposure (FlashAlpha)
        </span>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-6">
            <TabsTrigger value="overview" className="h-5 px-2 text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="chart" className="h-5 px-2 text-[10px]">Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats strip */}
      <div className="mb-2 grid grid-cols-4 gap-1 text-center text-[10px]">
        <div className="rounded bg-muted/30 p-1">
          <div className="text-muted-foreground">Net GEX</div>
          <div className={cn("font-mono font-semibold", isPositiveGex ? "text-green-500" : "text-red-500")}>
            {fmtCompact(gex.gex)}
          </div>
        </div>
        <div className="rounded bg-muted/30 p-1">
          <div className="text-muted-foreground">GEX Flip</div>
          <div className="font-mono font-semibold text-yellow-500">
            ${gex.gex_flip?.toFixed(2) ?? "—"}
          </div>
        </div>
        <div className="rounded bg-muted/30 p-1">
          <div className="text-muted-foreground">Net DEX</div>
          <div className="font-mono font-semibold">
            {fmtCompact(gex.dex)}
          </div>
        </div>
        <div className="rounded bg-muted/30 p-1">
          <div className="text-muted-foreground">VEX</div>
          <div className="font-mono font-semibold">
            {fmtCompact(gex.vex)}
          </div>
        </div>
      </div>

      {tab === "overview" && (
        <div className="flex-1 space-y-2 overflow-auto text-xs">
          {/* GEX interpretation */}
          <div className={cn(
            "rounded border p-2",
            isPositiveGex ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
          )}>
            <div className="flex items-center gap-1.5 font-medium">
              {isPositiveGex ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={isPositiveGex ? "text-green-500" : "text-red-500"}>
                {isPositiveGex ? "Positive Gamma" : "Negative Gamma"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {isPositiveGex
                ? "Dealers are long gamma. Expect mean-reverting, range-bound price action. Volatility likely to compress."
                : "Dealers are short gamma. Expect amplified moves in both directions. Higher volatility regime."}
            </p>
          </div>

          {/* GEX Flip level */}
          {gex.gex_flip && (
            <div className="flex items-center gap-1.5 rounded border border-yellow-500/30 bg-yellow-500/5 p-2">
              <Target className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-muted-foreground">GEX Flip at</span>
              <span className="font-mono font-semibold text-yellow-500">
                ${gex.gex_flip.toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                — price where dealer gamma flips sign
              </span>
            </div>
          )}

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border p-2">
              <div className="mb-1 font-medium text-green-500">Call GEX</div>
              <div className="font-mono text-lg">{fmtCompact(gex.call_gex)}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="mb-1 font-medium text-red-500">Put GEX</div>
              <div className="font-mono text-lg">{fmtCompact(gex.put_gex)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "chart" && (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => fmtCompact(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={60} />
              <Tooltip
                contentStyle={{ fontSize: 10, background: "#1a1a1a", border: "1px solid #333" }}
                formatter={(v: number) => [fmtCompact(v), ""]}
              />
              <ReferenceLine x={0} stroke="#666" />
              <Bar dataKey="value" radius={2}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
