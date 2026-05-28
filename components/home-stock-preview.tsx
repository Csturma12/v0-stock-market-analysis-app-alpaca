"use client"

import { useState } from "react"
import useSWR from "swr"
import { TrendingUp, TrendingDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const QUICK_PICKS = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "SPY", "QQQ"]

type Quote = {
  symbol: string
  price: number | null
  change: number | null
  changePct: number | null
  high: number | null
  low: number | null
  volume: number | null
}

export function HomeStockPreview() {
  const [selected, setSelected] = useState("SPY")
  const [input, setInput] = useState("")

  const { data: quote, isLoading } = useSWR<{ quote: Quote }>(
    `/api/ticker/${selected}/quote`,
    fetcher,
    { refreshInterval: 15_000 },
  )

  const q = quote?.quote
  const isUp = q?.changePct != null && q.changePct >= 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const sym = input.trim().toUpperCase()
    if (sym) {
      setSelected(sym)
      setInput("")
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Preview</span>
          <span className="font-semibold text-sm">{selected}</span>
          {q && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm tabular-nums">${q.price?.toFixed(2) ?? "—"}</span>
              <span className={cn(
                "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
                isUp ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
              )}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {q.changePct != null ? `${isUp ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search input */}
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="Ticker..."
              maxLength={6}
              className="w-20 rounded-md border border-border bg-muted/30 px-2 py-1 font-mono text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="rounded-md border border-border bg-muted/30 p-1 hover:bg-muted transition-colors">
              <Search className="h-3 w-3 text-muted-foreground" />
            </button>
          </form>
          <Link
            href={`/ticker/${selected}`}
            className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:bg-muted transition-colors"
          >
            Full Analysis
          </Link>
        </div>
      </div>

      {/* Quick picks */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto">
        {QUICK_PICKS.map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => setSelected(sym)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
              selected === sym
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* TradingView chart embed */}
      <div className="relative" style={{ height: 320 }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <span className="font-mono text-xs text-muted-foreground animate-pulse">Loading chart...</span>
          </div>
        )}
        <iframe
          key={selected}
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_chart_home&symbol=${selected}&interval=D&hidesidetoolbar=1&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&allow_symbol_change=0&hidevolume=0&scalePosition=right&scaleMode=Normal&fontFamily=monospace&noToolbar=0&watchlist=[]&details=0&hotlist=0&calendar=0&widgetbar_width=0&utm_medium=widget_new&utm_campaign=chart`}
          title={`${selected} chart`}
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>

      {/* Stats row */}
      {q && (
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <div className="flex flex-col items-center py-2 px-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">High</span>
            <span className="font-mono text-xs tabular-nums text-[color:var(--color-bull)]">${q.high?.toFixed(2) ?? "—"}</span>
          </div>
          <div className="flex flex-col items-center py-2 px-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Low</span>
            <span className="font-mono text-xs tabular-nums text-[color:var(--color-bear)]">${q.low?.toFixed(2) ?? "—"}</span>
          </div>
          <div className="flex flex-col items-center py-2 px-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Vol</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {q.volume != null ? (q.volume >= 1_000_000 ? `${(q.volume / 1_000_000).toFixed(1)}M` : `${(q.volume / 1000).toFixed(0)}K`) : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
