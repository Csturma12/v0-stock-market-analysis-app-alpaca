"use client"

import useSWR from "swr"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerChart({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher, { refreshInterval: 60_000 })
  const candles: { t: number; c: number }[] = data?.candles ?? []
  const chartData = candles.map((c) => ({
    date: new Date(c.t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    close: c.c,
  }))

  const first = candles[0]?.c
  const last = candles[candles.length - 1]?.c
  const isUp = first != null && last != null && last >= first
  const color = isUp ? "var(--color-bull)" : "var(--color-bear)"

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Price · 90 days</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Polygon</span>
      </div>
      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Close"]}
              />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#grad-${symbol})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
