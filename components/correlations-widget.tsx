"use client"

import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { cn } from "@/lib/utils"

type CorrRow = {
  ticker1: string
  ticker2: string
  correlation: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DEFAULT_TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AMD"]

export function CorrelationsWidget() {
  const { data, isLoading, error } = useSWR<{ data: CorrRow[] }>(
    `/api/uw/correlations?tickers=${DEFAULT_TICKERS.join(",")}`,
    fetcher,
    { refreshInterval: 300_000 }
  )

  const rows = data?.data ?? []

  // Build correlation matrix
  const tickers = DEFAULT_TICKERS
  const matrix: Record<string, Record<string, number>> = {}
  for (const t of tickers) {
    matrix[t] = {}
    for (const t2 of tickers) {
      matrix[t][t2] = t === t2 ? 1 : 0
    }
  }
  for (const r of rows) {
    if (matrix[r.ticker1] && matrix[r.ticker1][r.ticker2] !== undefined) {
      matrix[r.ticker1][r.ticker2] = r.correlation
      matrix[r.ticker2][r.ticker1] = r.correlation
    }
  }

  // Color scale: -1 = red, 0 = gray, +1 = green
  function corrColor(v: number): string {
    if (v >= 0.7) return "bg-emerald-600/80 text-white"
    if (v >= 0.4) return "bg-emerald-500/50"
    if (v >= 0.1) return "bg-emerald-400/30"
    if (v >= -0.1) return "bg-muted/50"
    if (v >= -0.4) return "bg-red-400/30"
    if (v >= -0.7) return "bg-red-500/50"
    return "bg-red-600/80 text-white"
  }

  return (
    <WidgetFrame
      title="Asset Correlations (30-day)"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
    >
      <div className="overflow-x-auto text-[10px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left font-medium text-muted-foreground"></th>
              {tickers.map((t) => (
                <th key={t} className="p-1 text-center font-medium text-muted-foreground w-10">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((t1) => (
              <tr key={t1}>
                <td className="p-1 font-medium text-muted-foreground">{t1}</td>
                {tickers.map((t2) => {
                  const v = matrix[t1][t2]
                  return (
                    <td key={t2} className={cn("p-1 text-center tabular-nums", corrColor(v))}>
                      {v.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600/80" /> Negative</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/50" /> Neutral</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-600/80" /> Positive</span>
      </div>
    </WidgetFrame>
  )
}
