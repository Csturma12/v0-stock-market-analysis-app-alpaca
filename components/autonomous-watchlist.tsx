"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type PatternStock = {
  symbol: string
  pattern_name: string
  pattern_type: string
  autonomy_score: number
  frequency: "daily" | "weekly" | "monthly"
  win_rate: number
  avg_return: number
  recommendation: string
}

export function AutonomousWatchlist() {
  const [stocks, setStocks] = useState<PatternStock[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/trading/patterns/top")
      .then((r) => r.json())
      .then(({ data }) => { if (data) setStocks(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleScan = async (symbol?: string) => {
    const sym = (symbol ?? query).trim().toUpperCase()
    if (!sym) return
    setScanError(null)
    setScanning(true)
    try {
      const res = await fetch(`/api/ticker/${sym}/patterns`, { method: "GET" })
      const json = await res.json()
      if (json.error) { setScanError(json.error); return }
      if (json.patterns?.length) {
        setStocks((prev) => {
          const existing = new Set(prev.map((s) => `${s.symbol}-${s.pattern_type}`))
          const newOnes = (json.patterns as PatternStock[]).filter(
            (p) => !existing.has(`${p.symbol}-${p.pattern_type}`)
          )
          return [...newOnes, ...prev]
        })
      } else {
        setScanError(`No strong patterns detected for ${sym} yet — try again after more price history is collected.`)
      }
      setQuery("")
    } catch {
      setScanError("Scan failed. Check your API connections.")
    } finally {
      setScanning(false)
    }
  }

  const removeStock = (symbol: string, patternType: string) => {
    setStocks((prev) => prev.filter((s) => !(s.symbol === symbol && s.pattern_type === patternType)))
  }

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Autonomous Pattern Watchlist</h3>
        </div>
        {stocks.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">{stocks.length} pattern{stocks.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Inline Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value.toUpperCase()); setScanError(null) }}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="Scan a ticker e.g. NVDA, AAPL, SPY…"
            className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => handleScan()}
          disabled={scanning || !query.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {scanning ? "Scanning…" : "Scan"}
        </button>
      </div>

      {/* Error */}
      {scanError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-400">{scanError}</p>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading saved patterns…
        </div>
      ) : stocks.length === 0 ? (
        <div className="py-6 text-center">
          <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Scan a ticker above to detect its tradeable patterns.</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">Patterns are saved automatically as you browse tickers.</p>
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {stocks.map((stock, idx) => (
            <PatternStockRow key={`${stock.symbol}-${stock.pattern_type}-${idx}`} stock={stock} onRemove={removeStock} />
          ))}
        </div>
      )}
    </section>
  )
}

function PatternStockRow({ stock, onRemove }: { stock: PatternStock; onRemove: (symbol: string, patternType: string) => void }) {
  const isHighConfidence = stock.autonomy_score >= 70
  const isFrequentTrade = stock.frequency === "weekly" || stock.frequency === "monthly"

  return (
    <div
      className={cn(
        "rounded-md border p-2.5 transition-all hover:shadow-sm",
        isHighConfidence && isFrequentTrade
          ? "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/5"
          : "border-border bg-card/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="font-mono font-bold text-sm">{stock.symbol}</h4>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{stock.pattern_name}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{stock.recommendation}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Autonomy Score */}
          <div className="flex flex-col items-end">
            <div
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-mono font-bold",
                stock.autonomy_score >= 70
                  ? "bg-[color:var(--color-bull)]/20 text-[color:var(--color-bull)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {Math.round(stock.autonomy_score)}
            </div>
          </div>

          {/* Win Rate */}
          <div className="flex flex-col items-end text-[10px]">
            <span className="font-mono font-semibold">{stock.win_rate}%</span>
            <span className="text-muted-foreground">WR</span>
          </div>

          {/* Return */}
          <div className="flex flex-col items-end text-[10px]">
            <span className={cn("font-mono font-semibold", stock.avg_return > 0 ? "text-[color:var(--color-bull)]" : "text-red-500")}>
              {stock.avg_return > 0 ? "+" : ""}
              {stock.avg_return.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">Return</span>
          </div>

          {/* Frequency Badge */}
          <div
            className={cn(
              "rounded text-[9px] font-mono font-bold uppercase px-1.5 py-0.5",
              stock.frequency === "weekly"
                ? "bg-blue-500/20 text-blue-500"
                : stock.frequency === "monthly"
                  ? "bg-purple-500/20 text-purple-500"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {stock.frequency}
          </div>

          {/* Remove button */}
          <button
            className="rounded p-1 hover:bg-muted transition-colors"
            title="Remove from watchlist"
            onClick={() => onRemove(stock.symbol, stock.pattern_type)}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
