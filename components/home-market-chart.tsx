"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_SYMBOLS = ["SPY", "IWM", "DIA", "QQQ"]
const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SearchResult = {
  ticker: string
  name: string
  primaryExchange: string
  type: string
  tvSymbol?: string
}

function TradingViewEmbed({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ""

    const container = document.createElement("div")
    container.className = "tradingview-widget-container"
    container.style.height = "100%"
    container.style.width = "100%"

    const widget = document.createElement("div")
    widget.className = "tradingview-widget-container__widget"
    widget.style.height = "100%"
    widget.style.width = "100%"
    container.appendChild(widget)

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      support_host: "https://www.tradingview.com",
    })

    container.appendChild(script)
    ref.current.appendChild(container)
  }, [symbol])

  return <div ref={ref} className="h-full w-full overflow-hidden rounded-md border border-border bg-card" />
}

export function HomeMarketChart() {
  const [symbol, setSymbol] = useState("SPY")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("SPY")

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 200)
    return () => window.clearTimeout(t)
  }, [query])

  const { data, isLoading } = useSWR<{ results: SearchResult[] }>(
    debounced.length > 0 ? `/api/search/tickers?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true },
  )

  const results = data?.results ?? []

  const symbolButtons = useMemo(() => DEFAULT_SYMBOLS, [])

  function applySelection(ticker: string, label?: string, tvSymbol?: string) {
    setSymbol((tvSymbol || ticker).toUpperCase())
    setSelectedLabel((label || ticker).toUpperCase())
    setQuery("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/30 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-lg font-bold tabular-nums">{selectedLabel}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">TradingView</span>
        </div>
        <div className="flex items-center gap-1">
          {symbolButtons.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSymbol(s)
                setSelectedLabel(s)
              }}
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                symbol === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-border/20 px-2 py-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              const pick = results[0]
              if (pick) {
                applySelection(pick.ticker, pick.ticker, pick.tvSymbol)
              } else if (query.trim()) {
                applySelection(query.trim().toUpperCase())
              }
            }}
            placeholder="Search any ticker..."
            className="h-8 w-full rounded border border-border bg-background pl-8 pr-3 font-mono text-xs outline-none focus:border-primary/70"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {isLoading && debounced && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching...
            </span>
          )}
          {results.slice(0, 4).map((r) => (
            <button
              key={r.ticker}
              type="button"
              onClick={() => applySelection(r.ticker, r.ticker, r.tvSymbol)}
              className="rounded border border-border bg-muted/20 px-2 py-1 font-mono text-[10px] hover:border-primary/60 hover:text-foreground"
              title={r.name}
            >
              {r.ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-1">
        <TradingViewEmbed symbol={symbol} />
      </div>
    </div>
  )
}
