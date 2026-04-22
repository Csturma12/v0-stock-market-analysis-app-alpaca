"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TradingAccount() {
  const { data } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const acc = data?.account

  if (acc?.error) {
    return (
      <div className="rounded-lg border border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10 p-5">
        <h3 className="mb-1 text-base font-semibold">Alpaca not connected</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY as env vars (use Paper keys from app.alpaca.markets).
        </p>
      </div>
    )
  }

  const equity = Number(acc?.equity ?? 0)
  const lastEquity = Number(acc?.last_equity ?? 0)
  const dayPct = lastEquity ? ((equity - lastEquity) / lastEquity) * 100 : 0
  const up = dayPct >= 0

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Paper Account</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {acc?.status ?? "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Cell label="Equity" value={fmt(equity)} />
        <Cell
          label="Day P&L"
          value={`${up ? "+" : ""}${dayPct.toFixed(2)}%`}
          color={up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"}
        />
        <Cell label="Cash" value={fmt(Number(acc?.cash ?? 0))} />
        <Cell label="Buying Power" value={fmt(Number(acc?.buying_power ?? 0))} />
      </div>
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-xl font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
