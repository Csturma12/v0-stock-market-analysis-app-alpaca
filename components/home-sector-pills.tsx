"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTORS } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = {
  ticker: string
  price: number | null
  change: number | null
  changePct: number | null
  volume: number | null
}

// Compute conviction score 0-100
function convictionScore(snap: Snap, medianVol: number): number {
  const pct = Math.abs(snap.changePct ?? 0)
  const vol = snap.volume ?? 0
  const volRatio = medianVol > 0 ? Math.min(vol / medianVol, 5) : 1
  const momentum = Math.min(pct * 10, 50)
  const volScore = Math.min(((volRatio - 1) / 4) * 50, 50)
  return Math.round(momentum + volScore)
}

function signalLabel(snap: Snap, score: number): "BUY" | "SELL" | "HOLD" {
  const pct = snap.changePct ?? 0
  if (score >= 60 && pct > 1) return "BUY"
  if (score >= 60 && pct < -1) return "SELL"
  return "HOLD"
}

// Single collapsible sector
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
    <div className="rounded-md border border-border/60 bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[color:var(--color-bull)]">
            {label}
          </span>
          <span className="rounded-full bg-muted/60 px-1.5 py-px font-mono text-[8px] text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground/60 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/40">
          {rows.map(({ snap, score, signal }) => {
            const up = (snap.changePct ?? 0) >= 0
            return (
              <Link
                key={snap.ticker}
                href={`/ticker/${snap.ticker}`}
                className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0"
              >
                <span className="w-12 shrink-0 font-mono text-[10px] font-semibold text-foreground">
                  {snap.ticker}
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                  {snap.price != null ? `$${snap.price.toFixed(2)}` : "—"}
                </span>
                <span
                  className={cn(
                    "w-12 shrink-0 text-right font-mono text-[10px] tabular-nums",
                    snap.changePct == null && "text-muted-foreground",
                    snap.changePct != null && up && "text-[color:var(--color-bull)]",
                    snap.changePct != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {snap.changePct == null ? "—" : `${up ? "+" : ""}${snap.changePct.toFixed(2)}%`}
                </span>
                <span
                  className={cn(
                    "w-9 shrink-0 rounded px-1 py-px text-center font-mono text-[8px] font-bold uppercase",
                    signal === "BUY" && "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                    signal === "SELL" && "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                    signal === "HOLD" && "bg-muted text-muted-foreground",
                  )}
                >
                  {signal}
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-[8px] tabular-nums text-muted-foreground/60">
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

export function HomeSectorPills({ column }: { column: 0 | 1 }) {
  // Split 11 sectors into two columns: 0 = first 6, 1 = last 5
  const mySectors = column === 0 ? SECTORS.slice(0, 6) : SECTORS.slice(6)

  // Flatten all tickers for API call
  const allTickers = useMemo(
    () => [...new Set(mySectors.flatMap((s) => s.subIndustries.flatMap((sub) => sub.tickers)))],
    [mySectors]
  )

  const { data } = useSWR<{ data: Snap[] }>(
    allTickers.length ? `/api/market/subindustry?tickers=${allTickers.join(",")}` : null,
    fetcher,
    { refreshInterval: 30_000 }
  )

  const snapMap = useMemo(() => {
    const map = new Map<string, Snap>()
    for (const s of data?.data ?? []) map.set(s.ticker, s)
    return map
  }, [data])

  // Median volume for conviction scoring
  const medianVol = useMemo(() => {
    const vols = (data?.data ?? []).map((s) => s.volume ?? 0).filter((v) => v > 0).sort((a, b) => a - b)
    return vols[Math.floor(vols.length / 2)] ?? 1_000_000
  }, [data])

  // Build scored groups
  const scoredGroups = useMemo(() => {
    return mySectors.map((sector, idx) => {
      const tickerSet = new Set(sector.subIndustries.flatMap((sub) => sub.tickers))
      const rows = [...tickerSet]
        .map((t) => {
          const snap = snapMap.get(t) ?? { ticker: t, price: null, change: null, changePct: null, volume: null }
          const score = convictionScore(snap, medianVol)
          const signal = signalLabel(snap, score)
          return { snap, score, signal }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      return { label: sector.name, rows, defaultOpen: idx === 0 }
    })
  }, [mySectors, snapMap, medianVol])

  return (
    <div className="flex flex-col gap-1">
      {scoredGroups.map((g) => (
        <SectorPill key={g.label} label={g.label} rows={g.rows} defaultOpen={g.defaultOpen} />
      ))}
    </div>
  )
}
