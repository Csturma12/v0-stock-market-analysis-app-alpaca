"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice, fmtVolume } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = {
  ticker: string
  price: number | null
  change: number | null
  changePct: number | null
  volume: number | null
  name?: string
}

type SortKey = "ticker" | "price" | "change" | "changePct" | "volume"
type SortDir = "asc" | "desc"

export function TrendingTickers({ tickers }: { tickers: string[] }) {
  const { data } = useSWR<{ data: Snap[] }>(
    `/api/market/subindustry?tickers=${tickers.join(",")}`,
    fetcher,
    { refreshInterval: 30_000 },
  )

  const [sortKey, setSortKey] = useState<SortKey>("changePct")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const rows = useMemo(() => {
    const map = new Map<string, Snap>()
    for (const s of data?.data ?? []) map.set(s.ticker, s)
    const base = tickers.map((t) => ({
      ticker: t,
      price: map.get(t)?.price ?? null,
      change: map.get(t)?.change ?? null,
      changePct: map.get(t)?.changePct ?? null,
      volume: map.get(t)?.volume ?? null,
    }))
    const dir = sortDir === "asc" ? 1 : -1
    return [...base].sort((a, b) => {
      if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker) * dir
      const av = (a as any)[sortKey] as number | null
      const bv = (b as any)[sortKey] as number | null
      // Nulls always go to the bottom
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return (av - bv) * dir
    })
  }, [data, tickers, sortKey, sortDir])

  function toggle(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      // Default descending for numeric columns, ascending for ticker
      setSortDir(key === "ticker" ? "asc" : "desc")
    }
  }

  const headerBtn = (key: SortKey, label: string, align: "left" | "right" = "right") => {
    const active = sortKey === key
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : null
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        className={cn(
          "inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" ? "justify-end" : "justify-start",
        )}
      >
        {label}
        {Icon && <Icon className="h-3 w-3" />}
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-2.5 text-left">{headerBtn("ticker", "Ticker", "left")}</th>
            <th className="px-4 py-2.5 text-right">{headerBtn("price", "Price")}</th>
            <th className="px-4 py-2.5 text-right">{headerBtn("change", "Change")}</th>
            <th className="px-4 py-2.5 text-right">{headerBtn("changePct", "% Day")}</th>
            <th className="hidden px-4 py-2.5 text-right md:table-cell">{headerBtn("volume", "Volume")}</th>
            <th className="px-4 py-2.5 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const up = s.changePct != null && s.changePct >= 0
            return (
              <tr key={s.ticker} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="px-4 py-3">
                  <Link href={`/ticker/${s.ticker}`} className="font-mono text-sm font-semibold hover:text-primary">
                    {s.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{fmtPrice(s.price)}</td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-sm tabular-nums",
                    s.change == null && "text-muted-foreground",
                    s.change != null && up && "text-[color:var(--color-bull)]",
                    s.change != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {s.change == null ? "—" : `${up ? "+" : ""}${s.change.toFixed(2)}`}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-sm tabular-nums",
                    s.changePct == null && "text-muted-foreground",
                    s.changePct != null && up && "text-[color:var(--color-bull)]",
                    s.changePct != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {s.changePct == null ? "—" : fmtPct(s.changePct)}
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground md:table-cell">
                  {fmtVolume(s.volume)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/ticker/${s.ticker}`}
                    className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
                  >
                    Analyze
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
