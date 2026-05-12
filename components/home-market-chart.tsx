"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice, fmtVolume } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SYMBOLS = ["SPY", "QQQ", "IWM", "DIA"]
const RANGES = ["1D", "1M", "YTD"] as const

type Range = (typeof RANGES)[number]
type Candle = {
  date: string
  close: number
  volume: number
}

export function HomeMarketChart() {
  const [symbol, setSymbol] = useState("SPY")
  const [range, setRange] = useState<Range>("1M")
  const interval = range === "1D" ? "15m" : range === "YTD" ? "1d" : "1h"
  const { data, isLoading } = useSWR<{ candles: Candle[] }>(
    `/api/ticker/${symbol}/candles?range=${range}&interval=${interval}`,
    fetcher,
    { refreshInterval: 30_000, keepPreviousData: false },
  )

  const candles = data?.candles ?? []
  const chartData = useMemo(
    () =>
      candles.map((c) => ({
        date: c.date,
        close: c.close,
        volume: c.volume,
      })),
    [candles],
  )

  const first = candles[0]?.close ?? null
  const last = candles[candles.length - 1]?.close ?? null
  const changePct = first && last ? ((last / first) - 1) * 100 : null
  const up = (changePct ?? 0) >= 0
  const lastVolume = candles[candles.length - 1]?.volume ?? null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/30 px-2 py-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-bold tabular-nums">{symbol}</span>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{fmtPrice(last)}</span>
          <span className={cn("font-mono text-xs font-semibold tabular-nums", up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>
            {changePct == null ? "-" : fmtPct(changePct)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbol(s)}
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                symbol === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-2 py-1">
        <span className="font-mono text-[10px] text-muted-foreground">Vol {fmtVolume(lastVolume)}</span>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                range === r ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-1 pb-1">
        {isLoading && chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="home-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={up ? "var(--color-bull)" : "var(--color-bear)"} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={up ? "var(--color-bull)" : "var(--color-bear)"} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                formatter={(value: number) => [fmtPrice(value), symbol]}
                labelFormatter={(label) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={up ? "var(--color-bull)" : "var(--color-bear)"}
                fill="url(#home-chart-fill)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
