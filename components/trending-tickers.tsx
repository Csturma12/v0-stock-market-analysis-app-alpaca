"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtPrice } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = {
  ticker: string
  price: number | null
  change: number | null
  changePct: number | null
  volume: number | null
}

type SectorGroup = {
  label: string
  tickers: string[]
}

// Compute a conviction score 0-100 from changePct + relative volume
function convictionScore(snap: Snap, avgVolumes: Map<string, number>): number {
  const pct = Math.abs(snap.changePct ?? 0)
  const vol = snap.volume ?? 0
  const avgVol = avgVolumes.get(snap.ticker) ?? vol
  const volRatio = avgVol > 0 ? Math.min(vol / avgVol, 5) : 1

  // Momentum component (0-50): based on abs % move
  const momentum = Math.min(pct * 10, 50)

  // Volume conviction (0-50): how much above avg volume
  const volScore = Math.min(((volRatio - 1) / 4) * 50, 50)

  return Math.round(momentum + volScore)
}

function signalLabel(snap: Snap, score: number): "BUY" | "SELL" | "HOLD" {
  const pct = snap.changePct ?? 0
  if (score >= 65 && pct > 0) return "BUY"
  if (score >= 65 && pct < 0) return "SELL"
  return "HOLD"
}

// Single collapsible sector pill group
function SectorPill({
  label,
  rows,
  defaultOpen,
}: {
  label: string
  rows: { snap: Snap; score: number; signal: "BUY" | "SELL" | "HOLD" }[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-bull)]">
            {label}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Rows */}
      {open && (
        <div className="border-t border-border/60">
          {rows.map(({ snap, score, signal }) => {
            const up = (snap.changePct ?? 0) >= 0
            return (
              <Link
                key={snap.ticker}
                href={`/ticker/${snap.ticker}`}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
              >
                {/* Ticker */}
                <span className="w-14 shrink-0 font-mono text-xs font-semibold text-foreground">
                  {snap.ticker}
                </span>

                {/* Price */}
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {snap.price != null ? `$${snap.price.toFixed(2)}` : "—"}
                </span>

                {/* % Change */}
                <span
                  className={cn(
                    "flex-1 text-right font-mono text-xs tabular-nums",
                    snap.changePct == null && "text-muted-foreground",
                    snap.changePct != null && up && "text-[color:var(--color-bull)]",
                    snap.changePct != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {snap.changePct == null
                    ? "—"
                    : `${up ? "+" : ""}${snap.changePct.toFixed(2)}%`}
                </span>

                {/* Signal pill */}
                <span
                  className={cn(
                    "w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-wide",
                    signal === "BUY" &&
                      "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                    signal === "SELL" &&
                      "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                    signal === "HOLD" && "bg-muted text-muted-foreground",
                  )}
                >
                  {signal}
                </span>

                {/* Conviction % */}
                <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                  {score}%
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component — supports flat list (old API) or grouped sectors
// ─────────────────────────────────────────────────────────────
export function TrendingTickers({
  tickers,
  groups,
  maxPerGroup = 20,
}: {
  tickers?: string[]
  groups?: SectorGroup[]
  maxPerGroup?: number
}) {
  // Flatten all tickers from groups or use flat list
  const allTickers = useMemo(() => {
    if (groups) return [...new Set(groups.flatMap((g) => g.tickers))]
    return tickers ?? []
  }, [groups, tickers])

  const { data } = useSWR<{ data: Snap[] }>(
    allTickers.length
      ? `/api/market/subindustry?tickers=${allTickers.join(",")}`
      : null,
    fetcher,
    { refreshInterval: 30_000 }
  )

  // Build a quick avg-volume map (use volume itself as proxy when no historical data)
  // In practice, a real avg would come from a /history endpoint — here we use the median
  const avgVolumes = useMemo(() => {
    const map = new Map<string, number>()
    const snaps = data?.data ?? []
    const vols = snaps.map((s) => s.volume ?? 0).filter((v) => v > 0).sort((a, b) => a - b)
    const median = vols[Math.floor(vols.length / 2)] ?? 1_000_000
    for (const s of snaps) map.set(s.ticker, median)
    return map
  }, [data])

  const snapMap = useMemo(() => {
    const map = new Map<string, Snap>()
    for (const s of data?.data ?? []) map.set(s.ticker, s)
    return map
  }, [data])

  // Build scored + ranked rows per group
  const scoredGroups = useMemo(() => {
    const buildRows = (tickerList: string[]) =>
      tickerList
        .map((t) => {
          const snap = snapMap.get(t) ?? { ticker: t, price: null, change: null, changePct: null, volume: null }
          const score = convictionScore(snap, avgVolumes)
          const signal = signalLabel(snap, score)
          return { snap, score, signal }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPerGroup)

    if (groups) {
      return groups.map((g, i) => ({
        label: g.label,
        rows: buildRows(g.tickers),
        defaultOpen: i === 0,
      }))
    }

    // Flat list — single "Trending" group
    return [
      {
        label: "Trending",
        rows: buildRows(allTickers),
        defaultOpen: true,
      },
    ]
  }, [groups, allTickers, snapMap, avgVolumes, maxPerGroup])

  return (
    <div className="flex flex-col gap-1.5">
      {scoredGroups.map((g) => (
        <SectorPill
          key={g.label}
          label={g.label}
          rows={g.rows}
          defaultOpen={g.defaultOpen}
        />
      ))}
    </div>
  )
}
