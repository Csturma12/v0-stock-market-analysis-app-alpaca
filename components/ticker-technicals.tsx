"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice, fmtVolume } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerTechnicals({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher, { refreshInterval: 60_000 })
  const t = data?.technicals ?? {}
  const rsi = t.rsi14
  const rsiLabel = rsi == null ? "—" : rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral"
  const rsiColor = rsi == null ? "" : rsi > 70 ? "text-[color:var(--color-bear)]" : rsi < 30 ? "text-[color:var(--color-bull)]" : "text-muted-foreground"

  const rows: { label: string; value: string; color?: string }[] = [
    { label: "RSI (14)", value: rsi == null ? "—" : `${rsi.toFixed(1)} · ${rsiLabel}`, color: rsiColor },
    { label: "SMA 20", value: fmtPrice(t.sma20) },
    { label: "SMA 50", value: fmtPrice(t.sma50) },
    {
      label: "Momentum 5d",
      value: t.momentum5 == null ? "—" : fmtPct(t.momentum5),
      color: t.momentum5 == null ? "" : t.momentum5 >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]",
    },
    {
      label: "Momentum 20d",
      value: t.momentum20 == null ? "—" : fmtPct(t.momentum20),
      color: t.momentum20 == null ? "" : t.momentum20 >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]",
    },
    { label: "Avg Volume", value: fmtVolume(t.avgVolume) },
    { label: "Last Volume", value: fmtVolume(t.latestVolume) },
    {
      label: "Volume Ratio",
      value: t.volumeRatio == null ? "—" : `${t.volumeRatio.toFixed(2)}×`,
      color: t.volumeRatio == null ? "" : t.volumeRatio > 1.5 ? "text-[color:var(--color-bull)]" : "",
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Technicals</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Dark pool proxy</span>
      </div>
      <dl className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className={cn("font-mono text-sm font-medium tabular-nums", r.color)}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Note: True dark pool prints require Unusual Whales / FINRA ATS. Volume Ratio &gt; 1.5× is used here as a proxy
        for unusual institutional activity.
      </p>
    </div>
  )
}
