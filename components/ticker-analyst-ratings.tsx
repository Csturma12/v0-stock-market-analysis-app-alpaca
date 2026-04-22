"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Rec = { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }

export function TickerAnalystRatings({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher)
  const recs: Rec[] = data?.recommendations ?? []
  const latest = recs[0]

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Analyst Ratings</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {latest?.period ?? "—"}
        </span>
      </div>

      {!latest ? (
        <div className="text-sm text-muted-foreground">No analyst data available.</div>
      ) : (
        <div className="flex flex-col gap-3">
          <RatingBar label="Strong Buy" value={latest.strongBuy} total={sum(latest)} color="var(--color-bull)" />
          <RatingBar label="Buy" value={latest.buy} total={sum(latest)} color="oklch(0.70 0.16 150)" />
          <RatingBar label="Hold" value={latest.hold} total={sum(latest)} color="var(--color-muted-foreground)" />
          <RatingBar label="Sell" value={latest.sell} total={sum(latest)} color="oklch(0.65 0.18 30)" />
          <RatingBar label="Strong Sell" value={latest.strongSell} total={sum(latest)} color="var(--color-bear)" />
        </div>
      )}
    </div>
  )
}

function sum(r: Rec) {
  return r.strongBuy + r.buy + r.hold + r.sell + r.strongSell
}

function RatingBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
