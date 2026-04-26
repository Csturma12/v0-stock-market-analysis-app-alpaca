"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  ChevronDown, TrendingUp, Minus, TrendingDown,
  Brain, Building2, Shield, Flame, Stethoscope,
  Landmark, ShoppingCart, CircuitBoard, Scale, Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTORS } from "@/lib/constants"
import { THEMES } from "@/lib/themes"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = {
  ticker: string
  price: number | null
  change: number | null
  changePct: number | null
  volume: number | null
}

// Theme icons
const THEME_ICONS: Record<string, React.ElementType> = {
  "ai-industry": Brain,
  "ai-infrastructure": Building2,
  "defense-government": Shield,
  "energy-industrials": Flame,
  "healthcare-biopharma": Stethoscope,
  "banking-finance": Landmark,
  "consumer-retail": ShoppingCart,
  "real-estate": Building2,
  "political-ma": Scale,
  "semiconductors": CircuitBoard,
}

// Sector dot colors — fixed palette from screenshot
const SECTOR_DOT_COLORS: Record<string, string> = {
  "Technology":              "#00ff88",
  "Health Care":             "#ff4466",
  "Financials":              "#ffaa00",
  "Consumer Discretionary":  "#00bfff",
  "Communication Services":  "#ffff44",
  "Industrials":             "#00ff88",
  "Consumer Staples":        "#00bfff",
  "Energy":                  "#ffaa00",
  "Utilities":               "#00ff88",
  "Real Estate":             "#ff44ff",
  "Materials":               "#ffff44",
}

// Conviction score 0–99
function convictionScore(snap: Snap, medianVol: number): number {
  const pct = Math.abs(snap.changePct ?? 0)
  const vol = snap.volume ?? 0
  const volRatio = medianVol > 0 ? Math.min(vol / medianVol, 5) : 1
  const momentum = Math.min(pct * 10, 45)
  const volScore = Math.min(((volRatio - 1) / 4) * 45, 45)
  return Math.round(Math.min(momentum + volScore + 42, 99))
}

function signalFor(snap: Snap, score: number): "BUY" | "SELL" | "HOLD" {
  const pct = snap.changePct ?? 0
  if (score >= 75 && pct > 0.4) return "BUY"
  if (score >= 75 && pct < -0.4) return "SELL"
  if (pct > 1.2) return "BUY"
  if (pct < -1.2) return "SELL"
  return "HOLD"
}

// Determine pill border + dot color from overall group sentiment
function groupSentimentColor(rows: { signal: "BUY" | "SELL" | "HOLD" }[]): {
  border: string
  dot: string
  glow: string
} {
  const buys = rows.filter((r) => r.signal === "BUY").length
  const sells = rows.filter((r) => r.signal === "SELL").length
  const ratio = rows.length > 0 ? buys / rows.length : 0.5
  if (ratio >= 0.55) return { border: "border-[#00ff88]/50", dot: "#00ff88", glow: "shadow-[0_0_6px_#00ff8840]" }
  if (ratio <= 0.4)  return { border: "border-[#ff4466]/50", dot: "#ff4466", glow: "shadow-[0_0_6px_#ff446640]" }
  return { border: "border-amber-500/40", dot: "#ffaa00", glow: "" }
}

type Row = { snap: Snap; score: number; signal: "BUY" | "SELL" | "HOLD" }

function CollapsibleGroup({
  label,
  count,
  dotColor,
  icon: Icon,
  rows,
  defaultOpen,
}: {
  label: string
  count: number
  dotColor: string
  icon?: React.ElementType
  rows: Row[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { border, glow } = groupSentimentColor(rows)

  return (
    <div className={cn("rounded-sm border mb-1 overflow-hidden transition-all", border, open && glow)}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition-colors"
      >
        {Icon ? (
          <Icon className="h-3 w-3 shrink-0" style={{ color: dotColor }} />
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        )}
        <span className="flex-1 text-left font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: dotColor }}>
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">{count}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground/40 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {/* Expanded table */}
      {open && rows.length > 0 && (
        <div className="border-t border-border/30">
          {/* Column headers */}
          <div className="grid grid-cols-[16px_1fr_56px_52px_36px] gap-1 px-2.5 py-1 border-b border-border/20">
            <span className="font-mono text-[8px] text-muted-foreground/40 text-right">#</span>
            <span className="font-mono text-[8px] uppercase text-muted-foreground/40">Ticker</span>
            <span className="font-mono text-[8px] uppercase text-muted-foreground/40 text-right">Price</span>
            <span className="font-mono text-[8px] uppercase text-muted-foreground/40 text-center">Signal</span>
            <span className="font-mono text-[8px] uppercase text-muted-foreground/40 text-right">Conv.</span>
          </div>

          {rows.map(({ snap, score, signal }, idx) => {
            const up = (snap.changePct ?? 0) >= 0
            return (
              <Link
                key={snap.ticker}
                href={`/ticker/${snap.ticker}`}
                className="grid grid-cols-[16px_1fr_56px_52px_36px] gap-1 items-center px-2.5 py-1 hover:bg-white/5 transition-colors border-b border-border/10 last:border-0"
              >
                {/* Rank */}
                <span className="font-mono text-[8px] text-muted-foreground/30 text-right tabular-nums">{idx + 1}</span>

                {/* Ticker + % */}
                <div>
                  <p className="font-mono text-[10px] font-bold text-foreground leading-none">{snap.ticker}</p>
                  <p className={cn(
                    "font-mono text-[8px] tabular-nums leading-none mt-0.5",
                    snap.changePct == null ? "text-muted-foreground/40" :
                    up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
                  )}>
                    {snap.changePct == null ? "—" : `${up ? "+" : ""}${snap.changePct.toFixed(2)}%`}
                  </p>
                </div>

                {/* Price */}
                <span className="font-mono text-[9px] tabular-nums text-muted-foreground text-right">
                  {snap.price != null ? `$${snap.price.toFixed(2)}` : "—"}
                </span>

                {/* Signal pill */}
                <div className="flex justify-center">
                  <span className={cn(
                    "inline-flex items-center gap-0.5 rounded px-1 py-px font-mono text-[8px] font-bold uppercase leading-none",
                    signal === "BUY"  && "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
                    signal === "SELL" && "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                    signal === "HOLD" && "bg-amber-500/15 text-amber-400",
                  )}>
                    {signal === "BUY"  && <TrendingUp  className="h-2 w-2" />}
                    {signal === "SELL" && <TrendingDown className="h-2 w-2" />}
                    {signal === "HOLD" && <Minus        className="h-2 w-2" />}
                    {signal}
                  </span>
                </div>

                {/* Conviction */}
                <span className={cn(
                  "font-mono text-[9px] tabular-nums text-right font-semibold",
                  score >= 75 ? "text-[color:var(--color-bull)]" :
                  score <= 55 ? "text-[color:var(--color-bear)]" : "text-amber-400"
                )}>
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

export function HomeSectorPills() {
  // Collect all tickers from sectors + themes
  const allTickers = useMemo(() => {
    const set = new Set<string>()
    SECTORS.forEach((s) => s.subIndustries.forEach((sub) => sub.tickers.forEach((t) => set.add(t))))
    THEMES.forEach((t) => t.tickers.forEach((tk) => set.add(tk)))
    return [...set]
  }, [])

  const { data } = useSWR<{ data: Snap[] }>(
    allTickers.length ? `/api/market/subindustry?tickers=${allTickers.slice(0, 150).join(",")}` : null,
    fetcher,
    { refreshInterval: 30_000 }
  )

  const snapMap = useMemo(() => {
    const map = new Map<string, Snap>()
    for (const s of data?.data ?? []) map.set(s.ticker, s)
    return map
  }, [data])

  const medianVol = useMemo(() => {
    const vols = (data?.data ?? []).map((s) => s.volume ?? 0).filter((v) => v > 0).sort((a, b) => a - b)
    return vols[Math.floor(vols.length / 2)] ?? 1_000_000
  }, [data])

  // Build sector groups — top 10 by conviction
  const sectorGroups = useMemo(() =>
    SECTORS.map((sector, idx) => {
      const tickers = [...new Set(sector.subIndustries.flatMap((sub) => sub.tickers))]
      const rows: Row[] = tickers
        .map((t) => {
          const snap = snapMap.get(t) ?? { ticker: t, price: null, change: null, changePct: null, volume: null }
          const score = convictionScore(snap, medianVol)
          return { snap, score, signal: signalFor(snap, score) } as Row
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      return {
        label: sector.name,
        count: rows.length,
        dotColor: SECTOR_DOT_COLORS[sector.name] ?? "#00ff88",
        rows,
        defaultOpen: false,
      }
    }),
    [snapMap, medianVol]
  )

  // Build theme groups — top 10 by conviction
  const themeGroups = useMemo(() =>
    THEMES.map((theme) => {
      const rows: Row[] = theme.tickers
        .map((t) => {
          const snap = snapMap.get(t) ?? { ticker: t, price: null, change: null, changePct: null, volume: null }
          const score = convictionScore(snap, medianVol)
          return { snap, score, signal: signalFor(snap, score) } as Row
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      return {
        id: theme.id,
        label: theme.name,
        count: rows.length,
        dotColor: groupSentimentColor(rows).dot,
        icon: THEME_ICONS[theme.id] ?? Globe,
        rows,
      }
    }),
    [snapMap, medianVol]
  )

  // Split: left col = first 5 sectors + first 5 themes, right col = next 6 sectors + rest themes
  const leftSectors  = sectorGroups.slice(0, 5)
  const rightSectors = sectorGroups.slice(5)
  const leftThemes   = themeGroups.slice(0, 5)
  const rightThemes  = themeGroups.slice(5)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Legend */}
      <div className="shrink-0 flex items-center justify-end gap-3 px-2 py-1 border-b border-border/30">
        <span className="flex items-center gap-1 font-mono text-[8px] text-[#00ff88]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00ff88]" />Bullish
        </span>
        <span className="flex items-center gap-1 font-mono text-[8px] text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Neutral
        </span>
        <span className="flex items-center gap-1 font-mono text-[8px] text-[#ff4466]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff4466]" />Bearish
        </span>
      </div>

      {/* Two-column grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-border/30 overflow-hidden">
        {/* Left column */}
        <div className="overflow-y-auto p-1 space-y-0">
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40 px-1 pb-1">Sectors</p>
          {leftSectors.map((g) => (
            <CollapsibleGroup key={g.label} label={g.label} count={g.count} dotColor={g.dotColor} rows={g.rows} defaultOpen={false} />
          ))}
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40 px-1 pt-2 pb-1">Themes</p>
          {leftThemes.map((g) => (
            <CollapsibleGroup key={g.id} label={g.label} count={g.count} dotColor={g.dotColor} icon={g.icon} rows={g.rows} defaultOpen={false} />
          ))}
        </div>

        {/* Right column */}
        <div className="overflow-y-auto p-1 space-y-0">
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40 px-1 pb-1">Sectors</p>
          {rightSectors.map((g) => (
            <CollapsibleGroup key={g.label} label={g.label} count={g.count} dotColor={g.dotColor} rows={g.rows} defaultOpen={false} />
          ))}
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40 px-1 pt-2 pb-1">Themes</p>
          {rightThemes.map((g) => (
            <CollapsibleGroup key={g.id} label={g.label} count={g.count} dotColor={g.dotColor} icon={g.icon} rows={g.rows} defaultOpen={false} />
          ))}
        </div>
      </div>
    </div>
  )
}
