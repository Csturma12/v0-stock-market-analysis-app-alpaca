"use client"

import { useMemo, useState } from "react"
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

type RangeKey = "1D" | "1M" | "YTD" | "5Y"
type IntervalKey = "15m" | "1h" | "4h" | "1d" | "1w" | "1mo"

type RangeSpec = {
  key: RangeKey
  label: string
  title: string
  intervals: IntervalKey[]
  defaultInterval: IntervalKey
  refreshMs: number
}

const RANGES: RangeSpec[] = [
  { key: "1D", label: "1 Day", title: "Intraday", intervals: ["15m", "1h", "4h"], defaultInterval: "15m", refreshMs: 30_000 },
  { key: "1M", label: "1 Month", title: "1 Month", intervals: ["1h", "4h", "1d"], defaultInterval: "1d", refreshMs: 60_000 },
  { key: "YTD", label: "YTD", title: "Year to Date", intervals: ["4h", "1d", "1w"], defaultInterval: "1d", refreshMs: 60_000 },
  { key: "5Y", label: "5 Year", title: "5 Years", intervals: ["1d", "1w", "1mo"], defaultInterval: "1w", refreshMs: 300_000 },
]

const INTERVAL_LABELS: Record<IntervalKey, string> = {
  "15m": "15m",
  "1h": "1H",
  "4h": "4H",
  "1d": "Daily",
  "1w": "Weekly",
  "1mo": "Monthly",
}

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
  fullLabel: string
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

function formatLabel(t: number, interval: IntervalKey): { label: string; full: string } {
  const d = new Date(t)
  if (interval === "15m" || interval === "1h") {
    return {
      label: d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: false }),
      full: d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    }
  }
  if (interval === "4h") {
    return {
      label: d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: false }),
      full: d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric" }),
    }
  }
  if (interval === "1d") {
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      full: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }
  }
  if (interval === "1w") {
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      full: `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    }
  }
  // 1mo
  return {
    label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    full: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  }
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
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} stroke={color} strokeWidth={1} />
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
      <div className="mb-1 font-mono text-muted-foreground">{d.fullLabel}</div>
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
  const [rangeKey, setRangeKey] = useState<RangeKey>("1M")
  const [intervalKey, setIntervalKey] = useState<IntervalKey>("1d")

  const range = RANGES.find((r) => r.key === rangeKey)!
  // If the current interval isn't valid for this range, fall back to the range's default.
  const effectiveInterval: IntervalKey = range.intervals.includes(intervalKey) ? intervalKey : range.defaultInterval

  const { data, isLoading } = useSWR<{ candles: Candle[] }>(
    `/api/ticker/${symbol}/candles?range=${rangeKey}&interval=${effectiveInterval}`,
    fetcher,
    { refreshInterval: range.refreshMs, revalidateOnFocus: false },
  )
  const candles: Candle[] = data?.candles ?? []

  const chartData: ChartDatum[] = useMemo(() => {
    const closes = candles.map((c) => c.close)
    const sma20Series = sma(closes, 20)
    return candles.map((c, i) => {
      const { label, full } = formatLabel(c.t, effectiveInterval)
      return {
        label,
        fullLabel: full,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        range: [c.low, c.high],
        sma20: sma20Series[i],
        up: c.close >= c.open,
      }
    })
  }, [candles, effectiveInterval])

  function handleSelectRange(next: RangeSpec) {
    setRangeKey(next.key)
    // When the user changes range, if their current interval isn't valid here, switch to the range default.
    if (!next.intervals.includes(intervalKey)) {
      setIntervalKey(next.defaultInterval)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <h3 className="text-base font-semibold">
              Price <span className="text-muted-foreground">· {range.title} · {INTERVAL_LABELS[effectiveInterval]}</span>
            </h3>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Polygon</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Range</span>
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
            {RANGES.map((r) => {
              const active = r.key === rangeKey
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleSelectRange(r)}
                  aria-pressed={active}
                  className={`rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>

          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Interval</span>
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
            {range.intervals.map((iv) => {
              const active = iv === effectiveInterval
              return (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setIntervalKey(iv)}
                  aria-pressed={active}
                  className={`rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {INTERVAL_LABELS[iv]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--color-bull)]" /> Up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--color-bear)]" /> Down
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-foreground/70" /> SMA 20
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        {isLoading && chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart…</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data for this range/interval. Try a different selection.
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
                interval={Math.max(Math.floor(chartData.length / 7), 0)}
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
