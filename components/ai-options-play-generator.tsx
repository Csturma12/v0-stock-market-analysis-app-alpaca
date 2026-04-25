"use client"

import { useState } from "react"
import { Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type OptionsPlay = {
  ticker: string
  strategy: "CALL_SPREAD" | "PUT_SPREAD" | "IRON_CONDOR" | "STRANGLE" | "BUTTERFLY" | "NO_PLAY"
  expiry: "DAILY" | "WEEKLY" | "MONTHLY"
  long_strike: number | null
  short_strike: number | null
  max_profit: number | null
  max_loss: number | null
  breakeven: number | null
  probability_of_profit: number
  confidence: number
  bias: "bullish" | "bearish" | "neutral"
  reason: string
  risk_notes: string[]
}

export function AIOptionsPlayGenerator() {
  const [context, setContext] = useState("")
  const [expiry, setExpiry] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY")
  const [play, setPlay] = useState<OptionsPlay | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!context.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/options-play", {
        method: "POST",
        body: JSON.stringify({ context, expiry }),
      })
      const data = await res.json()
      setPlay(data)
    } catch (err) {
      console.error("[v0] Options play error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isNoPlay = play?.strategy === "NO_PLAY"
  const isBull = play?.bias === "bullish"

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">AI Options Plays</h3>
      </div>

      {/* Input */}
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Paste market data (price, IV, underlying momentum, etc.)…"
        className="mb-3 h-16 w-full rounded-md border border-border bg-background p-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Controls */}
      <div className="mb-3 flex gap-2">
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm font-mono"
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
        <button
          onClick={generate}
          disabled={loading || !context.trim()}
          className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Generate"}
        </button>
      </div>

      {/* Result */}
      {play ? (
        <div className="max-h-96 overflow-y-auto rounded-md border border-border/50 bg-background p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold">{play.ticker}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                isNoPlay ? "bg-muted text-muted-foreground" : isBull ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
              )}
            >
              {play.strategy}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reason</p>
            <p className="text-xs leading-relaxed text-foreground">{play.reason}</p>
          </div>

          {!isNoPlay && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Long Strike</p>
                  <p className="font-mono text-xs font-semibold">${play.long_strike?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Short Strike</p>
                  <p className="font-mono text-xs font-semibold">${play.short_strike?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Max Profit</p>
                  <p className="font-mono text-xs font-semibold text-green-400">${play.max_profit?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Max Loss</p>
                  <p className="font-mono text-xs font-semibold text-red-400">${play.max_loss?.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">POP</p>
                  <p className="font-mono text-xs font-semibold">{play.probability_of_profit}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confidence</p>
                  <p className="font-mono text-xs font-semibold">{play.confidence}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Expiry</p>
                  <p className="font-mono text-xs font-semibold">{play.expiry}</p>
                </div>
              </div>

              {play.breakeven && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Breakeven</p>
                  <p className="font-mono text-xs font-semibold">${play.breakeven.toFixed(2)}</p>
                </div>
              )}
            </>
          )}

          {play.risk_notes.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Risks</p>
              <ul className="space-y-1">
                {play.risk_notes.map((r, i) => (
                  <li key={i} className="text-[10px] text-yellow-400">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border/50 bg-background p-6 text-center text-sm text-muted-foreground">
          Generate options plays based on market context
        </div>
      )}
    </div>
  )
}
