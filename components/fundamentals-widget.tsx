"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatLargeNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = { symbol: string }
type Financial = {
  period: string
  revenue: number | null
  netIncome: number | null
  grossProfit: number | null
  operatingIncome: number | null
  totalAssets: number | null
  totalLiabilities: number | null
  totalEquity?: number | null
  cash?: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
  eps?: number | null
  epsActual?: number | null
  epsEstimate?: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ChartView = "income" | "balance" | "cash" | "eps"

export function FundamentalsWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const [chartView, setChartView] = useState<ChartView>("income")
  const { data, isLoading, error } = useSWR<{ data: Financial[] }>(
    `/api/uw/ticker/${symbol}/financials`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data?.data ?? []
  const latest = rows[0]
  const chartData = [...rows].slice(0, 8).reverse()

  return (
    <WidgetFrame
      title={`${symbol} Fundamentals`}
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="chart" className="px-2 py-1 text-xs">Chart</TabsTrigger>
            <TabsTrigger value="table" className="px-2 py-1 text-xs">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {latest && (
        <div className="border-b border-border/40 px-2 py-2">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Fundamentals</span>
            <span>Finnhub</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <MetricTile label="P/E (TTM)" value={latest.eps ?? latest.epsActual ? `${latest.eps ?? latest.epsActual}` : "—"} />
            <MetricTile label="Revenue" value={latest.revenue ? formatLargeNumber(latest.revenue) : "—"} />
            <MetricTile label="FCF" value={latest.freeCashFlow ? formatLargeNumber(latest.freeCashFlow) : "—"} />
            <MetricTile label="EPS" value={(latest.eps ?? latest.epsActual) !== null ? `$${(latest.eps ?? latest.epsActual)?.toFixed(2)}` : "—"} />
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <>
          <div className="flex gap-1 px-2 py-2">
            {(["income", "balance", "cash", "eps"] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={cn(
                  "rounded px-2 py-1 text-xs transition-colors",
                  chartView === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {v === "income" ? "Income" : v === "balance" ? "Balance" : v === "cash" ? "Cash Flow" : "EPS"}
              </button>
            ))}
          </div>
          <div className="h-[180px] px-2 pb-2">
            <div className="grid h-full grid-cols-1 gap-2">
              {chartView === "income" && <CompactBars rows={chartData} leftLabel="Revenue" rightLabel="Net Income" leftKey="revenue" rightKey="netIncome" leftColor="bg-blue-500" rightColor="bg-emerald-500" />}
              {chartView === "balance" && <CompactBars rows={chartData} leftLabel="Assets" rightLabel="Liabilities" leftKey="totalAssets" rightKey="totalLiabilities" leftColor="bg-blue-500" rightColor="bg-red-500" />}
              {chartView === "cash" && <CompactBars rows={chartData} leftLabel="Op CF" rightLabel="FCF" leftKey="operatingCashFlow" rightKey="freeCashFlow" leftColor="bg-blue-500" rightColor="bg-emerald-500" />}
              {chartView === "eps" && <CompactBars rows={chartData} leftLabel="EPS" rightLabel="EPS" leftKey="eps" rightKey="epsActual" leftColor="bg-emerald-500" rightColor="bg-emerald-500" single />}
            </div>
          </div>
        </>
      ) : (
        <div className="max-h-[250px] overflow-y-auto px-2 pb-2 text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="py-1 font-medium">Period</th>
                <th className="py-1 font-medium text-right">Revenue</th>
                <th className="py-1 font-medium text-right">Net Inc</th>
                <th className="py-1 font-medium text-right">FCF</th>
                <th className="py-1 font-medium text-right">EPS</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1">{r.period}</td>
                  <td className="py-1 text-right">{r.revenue ? formatLargeNumber(r.revenue) : "—"}</td>
                  <td className={cn("py-1 text-right", r.netIncome && r.netIncome < 0 ? "text-red-500" : "")}>
                    {r.netIncome ? formatLargeNumber(r.netIncome) : "—"}
                  </td>
                  <td className={cn("py-1 text-right", r.freeCashFlow && r.freeCashFlow < 0 ? "text-red-500" : "")}>
                    {r.freeCashFlow ? formatLargeNumber(r.freeCashFlow) : "—"}
                  </td>
                  <td className="py-1 text-right">
                    {(r.eps ?? r.epsActual) !== null ? `$${(r.eps ?? r.epsActual)?.toFixed(2)}` : "—"}
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/35 p-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function CompactBars({
  rows,
  leftLabel,
  rightLabel,
  leftKey,
  rightKey,
  leftColor,
  rightColor,
  single = false,
}: {
  rows: Financial[]
  leftLabel: string
  rightLabel: string
  leftKey: keyof Financial
  rightKey: keyof Financial
  leftColor: string
  rightColor: string
  single?: boolean
}) {
  const latest = rows[0]
  const left = Number(latest?.[leftKey] ?? 0)
  const right = Number(latest?.[rightKey] ?? 0)
  const max = Math.max(Math.abs(left), Math.abs(right), 1)
  const leftPct = Math.min(100, (Math.abs(left) / max) * 100)
  const rightPct = Math.min(100, (Math.abs(right) / max) * 100)

  return (
    <div className="flex h-full flex-col justify-between gap-2">
      <div className="space-y-2">
        <BarRow label={leftLabel} value={left} pct={leftPct} color={leftColor} />
        {!single && <BarRow label={rightLabel} value={right} pct={rightPct} color={rightColor} />}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded bg-muted/30 px-2 py-1">
          <div className="text-muted-foreground">{leftLabel}</div>
          <div className="font-mono font-semibold">{left ? formatLargeNumber(left) : "—"}</div>
        </div>
        {!single && (
          <div className="rounded bg-muted/30 px-2 py-1">
            <div className="text-muted-foreground">{rightLabel}</div>
            <div className="font-mono font-semibold">{right ? formatLargeNumber(right) : "—"}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function BarRow({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr_72px] items-center gap-2 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-background/80">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right font-mono tabular-nums">{formatLargeNumber(value || 0)}</span>
    </div>
  )
}
