"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerFundamentals({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher)
  const m = data?.metrics ?? {}

  const rows: { label: string; value: string; color?: string }[] = [
    { label: "P/E (TTM)", value: fmtNum(m.peTTM) },
    { label: "PEG", value: fmtNum(m.pegRatio) },
    { label: "P/S (TTM)", value: fmtNum(m.psTTM) },
    { label: "P/B", value: fmtNum(m.pbAnnual) },
    { label: "EPS (TTM)", value: fmtNum(m.epsTTM) },
    { label: "Revenue Growth", value: fmtPctMaybe(m.revenueGrowthTTMYoy), color: colorPn(m.revenueGrowthTTMYoy) },
    { label: "EPS Growth", value: fmtPctMaybe(m.epsGrowthTTMYoy), color: colorPn(m.epsGrowthTTMYoy) },
    { label: "Gross Margin", value: fmtPctMaybe(m.grossMarginTTM) },
    { label: "Operating Margin", value: fmtPctMaybe(m.operatingMarginTTM) },
    { label: "Net Margin", value: fmtPctMaybe(m.netProfitMarginTTM) },
    { label: "Debt / Equity", value: fmtNum(m["totalDebt/totalEquityAnnual"]) },
    { label: "ROE", value: fmtPctMaybe(m.roeTTM) },
    { label: "52w High", value: fmtNum(m["52WeekHigh"]) },
    { label: "52w Low", value: fmtNum(m["52WeekLow"]) },
    { label: "Beta", value: fmtNum(m.beta) },
    { label: "Div Yield", value: fmtPctMaybe(m.currentDividendYieldTTM) },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Fundamentals</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Finnhub</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={cn("font-mono text-sm font-medium tabular-nums", r.color)}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function fmtNum(v: unknown): string {
  if (v == null || Number.isNaN(Number(v))) return "—"
  const n = Number(v)
  if (Math.abs(n) >= 1000) return n.toFixed(0)
  return n.toFixed(2)
}
function fmtPctMaybe(v: unknown): string {
  if (v == null || Number.isNaN(Number(v))) return "—"
  return `${Number(v).toFixed(2)}%`
}
function colorPn(v: unknown): string {
  if (v == null) return ""
  const n = Number(v)
  if (Number.isNaN(n)) return ""
  return n >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
}
