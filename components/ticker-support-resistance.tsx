"use client"

import useSWR from "swr"
import { fmtPrice } from "@/lib/format"
import { TrendingUp, TrendingDown } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerSupportResistance({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher, { refreshInterval: 60_000 })
  const t = data?.technicals ?? {}
  const quote = data?.quote ?? {}

  const price = quote.last ?? quote.close ?? null

  // Derive key levels from technicals + 52w range
  type LevelType = "resistance" | "support" | "neutral"
  const resolve = (p: number | null, level: number | null): LevelType =>
    p && level ? (p > level ? "support" : "resistance") : "neutral"

  const levels: { label: string; value: number | null; type: LevelType }[] = [
    { label: "52w High", value: quote.week52High ?? null, type: "resistance" as LevelType },
    { label: "SMA 200", value: t.sma200 ?? null, type: resolve(price, t.sma200 ?? null) },
    { label: "SMA 50", value: t.sma50 ?? null, type: resolve(price, t.sma50 ?? null) },
    { label: "SMA 20", value: t.sma20 ?? null, type: resolve(price, t.sma20 ?? null) },
    { label: "52w Low", value: quote.week52Low ?? null, type: "support" as LevelType },
  ].filter((l) => l.value != null)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Key Support &amp; Resistance
      </h3>
      {levels.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading levels…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {levels.map((level) => (
            <div key={level.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {level.type === "resistance" ? (
                  <TrendingDown className="h-3 w-3 text-[color:var(--color-bear)]" />
                ) : level.type === "support" ? (
                  <TrendingUp className="h-3 w-3 text-[color:var(--color-bull)]" />
                ) : (
                  <span className="h-3 w-3" />
                )}
                <span className="text-xs text-muted-foreground">{level.label}</span>
              </div>
              <span
                className={
                  level.type === "resistance"
                    ? "font-mono text-sm font-semibold tabular-nums text-[color:var(--color-bear)]"
                    : level.type === "support"
                    ? "font-mono text-sm font-semibold tabular-nums text-[color:var(--color-bull)]"
                    : "font-mono text-sm font-semibold tabular-nums text-foreground"
                }
              >
                {fmtPrice(level.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
