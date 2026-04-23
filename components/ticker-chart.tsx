"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Timeframe = "15m" | "1h" | "4h" | "1d"

type TFOption = {
  value: Timeframe
  label: string
  title: string
  windowLabel: string
  refresh: number // ms
}

const TIMEFRAMES: TFOption[] = [
  { value: "15m", label: "15m", title: "15-Minute", windowLabel: "Last 7 days", refresh: 30_000 },
  { value: "1h", label: "1H", title: "Hourly", windowLabel: "Last 30 days", refresh: 60_000 },
  { value: "4h", label: "4H", title: "4-Hour", windowLabel: "Last 120 days", refresh: 60_000 },
  { value: "1d", label: "Daily", title: "Daily", windowLabel: "Last year", refresh: 60_000 },
]

type Candle = {
  t: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type ChartDatum = {
  label: string
  open: number
  high: number
  low: number
  close: number
  range: [number, number]
  sma20: number | null
  up: boolean
}

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += values[j]
    out.push(sum / period)
  }
  return out
}

function formatLabel(t: number, tf: Timeframe) {
  const d = new Date(t)
  if (tf === "15m" || tf === "1h") {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    })
  }
  if (tf === "4h") {
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: false })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function Candlestick(props: any) {
  const { x, y, width, height, payload } = props
  if (!payload || height == null) return null

  const { open, high, low, close, up } = payload as ChartDatum
  const range = high - low
  if (range <= 0) return null

  const color = up ? "var(--color-bull)" : "var(--color-bear)"

  const wickX = x + width / 2
  const wickTop = y
  const wickBottom = y + height

  const pxPerUnit = height / range
  const bodyTopValue = Math.max(open, close)
  const bodyBottomValue = Math.min(open, close)
  const bodyTop = y + (high - bodyTopValue) * pxPerUnit
  const bodyBottom = y + (high - bodyBottomValue) * pxPerUnit

  const bodyPadding = Math.max(width * 0.18, 1)
  const bodyX = x + bodyPadding
  const bodyWidth = Math.max(width - bodyPadding * 2, 1)
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={1} />
      <rect
        x={bodyX}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: ChartDatum | undefined = payload[0]?.payload
  if (!d) return null
  const changePct = ((d.close - d.open) / d.open) * 100
  const up = d.close >= d.open
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-mono text-muted-foreground">{d.label}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
        <span className="text-muted-foreground">O</span>
        <span>${d.open.toFixed(2)}</span>
        <span className="text-muted-foreground">H</span>
        <span>${d.high.toFixed(2)}</span>
        <span className="text-muted-foreground">L</span>
        <span>${d.low.toFixed(2)}</span>
        <span className="text-muted-foreground">C</span>
        <span>${d.close.toFixed(2)}</span>
        {d.sma20 != null && (
          <>
            <span className="text-muted-foreground">SMA20</span>
            <span>${d.sma20.toFixed(2)}</span>
          </>
        )}
      </div>
      <div className={`mt-1 font-mono ${up ? "text-[var(--color-bull)]" : "text-[var(--color-bear)]"}`}>
        {up ? "+" : ""}
        {changePct.toFixed(2)}%
      </div>
    </div>
  )
}

export function TickerChart({ symbol }: { symbol: string }) {
  const [tf, setTf] = useState<Timeframe>("1d")
  const active = TIMEFRAMES.find((t) => t.value === tf)!

  const { data, isLoading } = useSWR<{ candles: Candle[] }>(
    `/api/ticker/${symbol}/candles?tf=${tf}`,
    fetcher,
    { refreshInterval: active.refresh, revalidateOnFocus: false },
  )
  const candles: Candle[] = data?.candles ?? []

  const closes = candles.map((c) => c.close)
  const sma20Series = sma(closes, 20)

  const chartData: ChartDatum[] = candles.map((c, i) => ({
    label: formatLabel(c.t, tf),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    range: [c.low, c.high],
    sma20: sma20Series[i],
    up: c.close >= c.open,
  }))

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="text-base font-semibold">
            Price <span className="text-muted-foreground">· {active.title}</span>
          </h3>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {active.windowLabel}
          </span>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
          {TIMEFRAMES.map((t) => {
            const isActive = t.value === tf
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTf(t.value)}
                aria-pressed={isActive}
                className={`rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--color-bull)]" /> Up
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--color-bear)]" /> Down
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-foreground/70" /> SMA 20
        </span>
        <span className="ml-auto text-muted-foreground">Polygon</span>
      </div>

      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isLoading ? "Loading chart…" : "No data for this timeframe"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barCategoryGap={1}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(Math.floor(chartData.length / 6), 0)}
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
              />
              <Tooltip content={<CandleTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
              <Bar dataKey="range" shape={<Candlestick />} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="var(--color-foreground)"
                strokeOpacity={0.7}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
