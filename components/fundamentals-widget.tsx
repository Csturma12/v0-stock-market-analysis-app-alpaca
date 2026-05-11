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
  Legend,
} from "recharts"
import { formatLargeNumber } from "@/lib/format"

type Props = { symbol: string }
type Financial = {
  period: string
  revenue: number | null
  netIncome: number | null
  grossProfit: number | null
  operatingIncome: number | null
  totalAssets: number | null
  totalLiabilities: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
  epsActual: number | null
  epsEstimate: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ChartView = "income" | "balance" | "cash" | "eps"

export function FundamentalsWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"chart" | "table">("chart")
  const [chartView, setChartView] = useState<ChartView>("income")
  const { data, isLoading, error } = useSWR<Financial[]>(
    `/api/uw/ticker/${symbol}/financials`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data ?? []
  const latest = rows[0]

  const chartData = [...rows].slice(0, 8).reverse()

  return (
    <WidgetFrame
      title="Fundamentals"
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
            <div className="text-muted-foreground">Revenue</div>
            <div className="font-medium">{latest.revenue ? formatLargeNumber(latest.revenue) : "—"}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Net Inc</div>
            <div className={`font-medium ${latest.netIncome && latest.netIncome < 0 ? "text-red-500" : ""}`}>
              {latest.netIncome ? formatLargeNumber(latest.netIncome) : "—"}
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">FCF</div>
            <div className={`font-medium ${latest.freeCashFlow && latest.freeCashFlow < 0 ? "text-red-500" : ""}`}>
              {latest.freeCashFlow ? formatLargeNumber(latest.freeCashFlow) : "—"}
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">EPS</div>
            <div className="font-medium">{latest.epsActual !== null ? `$${latest.epsActual.toFixed(2)}` : "—"}</div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <>
          {/* Chart view selector */}
          <div className="flex gap-1 mb-2">
            {(["income", "balance", "cash", "eps"] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`text-xs px-2 py-1 rounded ${chartView === v ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {v === "income" ? "Income" : v === "balance" ? "Balance" : v === "cash" ? "Cash Flow" : "EPS"}
              </button>
            ))}
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => formatLargeNumber(v)} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(v: number) => formatLargeNumber(v)}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {chartView === "income" && (
                  <>
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" />
                    <Bar dataKey="netIncome" name="Net Income" fill="#22c55e" />
                  </>
                )}
                {chartView === "balance" && (
                  <>
                    <Bar dataKey="totalAssets" name="Assets" fill="#3b82f6" />
                    <Bar dataKey="totalLiabilities" name="Liabilities" fill="#ef4444" />
                  </>
                )}
                {chartView === "cash" && (
                  <>
                    <Bar dataKey="operatingCashFlow" name="Op CF" fill="#3b82f6" />
                    <Bar dataKey="freeCashFlow" name="FCF" fill="#22c55e" />
                  </>
                )}
                {chartView === "eps" && (
                  <>
                    <Bar dataKey="epsActual" name="EPS Actual" fill="#22c55e" />
                    <Bar dataKey="epsEstimate" name="EPS Est" fill="#94a3b8" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="max-h-[250px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Period</th>
                <th className="py-1 font-medium text-right">Revenue</th>
                <th className="py-1 font-medium text-right">Net Inc</th>
                <th className="py-1 font-medium text-right">FCF</th>
                <th className="py-1 font-medium text-right">EPS</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1">{r.period}</td>
                  <td className="py-1 text-right">{r.revenue ? formatLargeNumber(r.revenue) : "—"}</td>
                  <td className={`py-1 text-right ${r.netIncome && r.netIncome < 0 ? "text-red-500" : ""}`}>
                    {r.netIncome ? formatLargeNumber(r.netIncome) : "—"}
                  </td>
                  <td className={`py-1 text-right ${r.freeCashFlow && r.freeCashFlow < 0 ? "text-red-500" : ""}`}>
                    {r.freeCashFlow ? formatLargeNumber(r.freeCashFlow) : "—"}
                  </td>
                  <td className="py-1 text-right">{r.epsActual !== null ? `$${r.epsActual.toFixed(2)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
