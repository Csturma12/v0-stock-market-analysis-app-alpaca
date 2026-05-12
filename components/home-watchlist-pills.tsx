"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { MoreHorizontal, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice, fmtVolume } from "@/lib/format"
import {
  addTickerToWatchlist,
  cleanSymbol,
  DEFAULT_WATCHLISTS,
  readWatchlists,
  removeTickerFromWatchlist,
  type Watchlists,
} from "./watchlist-storage"

const fetcher = async (symbols: string[]) => {
  const rows = await Promise.all(
    symbols.map((symbol) =>
      fetch(`/api/ticker/${encodeURIComponent(symbol)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  )
  return rows.filter(Boolean)
}

type TickerData = {
  symbol: string
  snapshot?: { price?: number; open?: number; high?: number; low?: number; changePct?: number; volume?: number }
  candles?: Array<{ open: number; high: number; low: number; close: number; volume: number }>
  technicals?: { volumeRatio?: number | null; momentum5?: number | null }
}

function scoreHotToday(row: TickerData) {
  const move = Math.abs(row.snapshot?.changePct ?? 0)
  const volRatio = row.technicals?.volumeRatio ?? 1
  const momentum = Math.abs(row.technicals?.momentum5 ?? 0) / 2
  return Math.min(99, Math.round(35 + move * 9 + Math.max(0, volRatio - 1) * 22 + momentum))
}

export function HomeWatchlistPills() {
  const [watchlists, setWatchlists] = useState<Watchlists>(DEFAULT_WATCHLISTS)
  const [activeList, setActiveList] = useState("Main")
  const [newSymbol, setNewSymbol] = useState("")

  useEffect(() => {
    setWatchlists(readWatchlists())
    const handler = (event: Event) => setWatchlists((event as CustomEvent<Watchlists>).detail ?? readWatchlists())
    window.addEventListener("watchlists-updated", handler)
    return () => window.removeEventListener("watchlists-updated", handler)
  }, [])

  const listNames = Object.keys(watchlists)
  const symbols = useMemo(() => (watchlists[activeList] ?? []).map(cleanSymbol).filter(Boolean), [watchlists, activeList])
  const { data, isLoading } = useSWR(symbols.length ? ["watchlist-quotes", ...symbols] : null, () => fetcher(symbols), {
    refreshInterval: 30_000,
    keepPreviousData: false,
  })
  const rows = ((data ?? []) as TickerData[]).sort((a, b) => scoreHotToday(b) - scoreHotToday(a))

  function addToActiveList() {
    const sym = cleanSymbol(newSymbol)
    if (!sym) return
    addTickerToWatchlist(sym, activeList)
    setNewSymbol("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/30 px-2 py-1.5">
        <div className="flex items-center gap-1">
          {listNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveList(name)}
              className={cn(
                "rounded px-2 py-0.5 font-mono text-[10px] transition-colors",
                activeList === name ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            value={newSymbol}
            onChange={(event) => setNewSymbol(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === "Enter" && addToActiveList()}
            placeholder="Add"
            className="h-6 w-16 rounded border border-border bg-background px-2 font-mono text-[10px] outline-none focus:border-primary/70"
          />
          <Button type="button" size="icon-sm" variant="outline" className="h-6 w-6" onClick={addToActiveList}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {isLoading && rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading watchlist...</div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Add a ticker to start tracking.</div>
        ) : (
          <div className="space-y-1">
            {rows.map((row) => {
              const candle = row.candles?.[row.candles.length - 1]
              const o = row.snapshot?.open ?? candle?.open ?? null
              const h = row.snapshot?.high ?? candle?.high ?? null
              const l = row.snapshot?.low ?? candle?.low ?? null
              const c = row.snapshot?.price ?? candle?.close ?? null
              const pct = row.snapshot?.changePct ?? null
              const up = (pct ?? 0) >= 0
              const hot = scoreHotToday(row)

              return (
                <div key={row.symbol} className="grid grid-cols-[52px_1fr_42px_24px] items-center gap-2 rounded border border-border/50 bg-card/40 px-2 py-1 hover:bg-muted/30">
                  <Link href={`/ticker/${row.symbol}`} className="font-mono text-xs font-bold text-foreground hover:text-primary">
                    {row.symbol}
                  </Link>
                  <Link href={`/ticker/${row.symbol}`} className="min-w-0">
                    <div className="grid grid-cols-4 gap-1 font-mono text-[9px] text-muted-foreground">
                      <span>O {fmtPrice(o)}</span>
                      <span>H {fmtPrice(h)}</span>
                      <span>L {fmtPrice(l)}</span>
                      <span>C {fmtPrice(c)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px]">
                      <span className={cn(up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]")}>{pct == null ? "-" : fmtPct(pct)}</span>
                      <span className="text-muted-foreground">Vol {fmtVolume(row.snapshot?.volume)}</span>
                    </div>
                  </Link>
                  <span className={cn("rounded px-1.5 py-0.5 text-center font-mono text-[9px] font-bold", hot >= 75 ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]" : hot >= 55 ? "bg-amber-500/15 text-amber-400" : "bg-muted text-muted-foreground")}>
                    Hot {hot}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs">Move / Copy</DropdownMenuLabel>
                      {listNames.map((name) => (
                        <DropdownMenuItem key={name} onSelect={() => addTickerToWatchlist(row.symbol, name)} className="text-xs">
                          Add to {name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => removeTickerFromWatchlist(row.symbol, activeList)} className="text-xs">
                        <X className="h-3.5 w-3.5" />
                        Remove from {activeList}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
