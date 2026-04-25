"use client"

import { useState } from "react"
import { Zap, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStagedTrades } from "@/lib/staged-trade-context"

type OptionsPlay = {
  ticker: string
  strategy: "CALL_SPREAD" | "PUT_SPREAD" | "IRON_CONDOR" | "STRANGLE" | "BUTTERFLY" | "NO_PLAY"
  expiry: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
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
  const [expiry, setExpiry] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("WEEKLY")
  
  // Claude state
  const [claudePlay, setClaudePlay] = useState<OptionsPlay | null>(null)
  const [claudeLoading, setClaudeLoading] = useState(false)
  
  // OpenAI state
  const [openaiPlay, setOpenaiPlay] = useState<OptionsPlay | null>(null)
  const [openaiLoading, setOpenaiLoading] = useState(false)

  const { stageOptions } = useStagedTrades()

  const generateBoth = async () => {
    if (!context.trim()) return
    
    // Generate from both in parallel
    setClaudeLoading(true)
    setOpenaiLoading(true)
    
    // Claude
    fetch("/api/options-play-claude", {
      method: "POST",
      body: JSON.stringify({ context, expiry }),
    })
      .then((res) => res.json())
      .then((data) => setClaudePlay(data))
      .catch((err) => console.error("[v0] Claude options error:", err))
      .finally(() => setClaudeLoading(false))
    
    // OpenAI
    fetch("/api/options-play", {
      method: "POST",
      body: JSON.stringify({ context, expiry }),
    })
      .then((res) => res.json())
      .then((data) => setOpenaiPlay(data))
      .catch((err) => console.error("[v0] OpenAI options error:", err))
      .finally(() => setOpenaiLoading(false))
  }

  const handleStage = (play: OptionsPlay, source: "claude" | "openai") => {
    if (play.strategy === "NO_PLAY") return
    
    const isSpread = play.strategy.includes("SPREAD")
    const isBullish = play.bias === "bullish"
    
    stageOptions({
      source,
      ticker: play.ticker,
      strategy: play.strategy,
      expiry: play.expiry,
      bias: play.bias,
      legs: [
        {
          instrument: isBullish ? "call" : "put",
          action: "buy",
          strike: play.long_strike ?? 0,
          qty: 1,
        },
        ...(isSpread && play.short_strike ? [{
          instrument: (isBullish ? "call" : "put") as "call" | "put",
          action: "sell" as const,
          strike: play.short_strike,
          qty: 1,
        }] : []),
      ],
      thesis: play.reason,
      timestamp: Date.now(),
    })
  }

  const renderPlay = (play: OptionsPlay | null, loading: boolean, source: "claude" | "openai") => {
    const label = source === "claude" ? "Claude" : "OpenAI"
    const color = source === "claude" ? "purple" : "green"
    
    if (loading) {
      return (
        <div className="flex h-48 items-center justify-center rounded-md border border-border/50 bg-background">
          <Loader2 className={cn("h-5 w-5 animate-spin", color === "purple" ? "text-purple-400" : "text-green-400")} />
        </div>
      )
    }
    
    if (!play) {
      return (
        <div className="flex h-48 items-center justify-center rounded-md border border-border/50 bg-background text-center text-xs text-muted-foreground">
          Generate to see {label}&apos;s play
        </div>
      )
    }
    
    const isNoPlay = play.strategy === "NO_PLAY"
    const isBull = play.bias === "bullish"
    
    return (
      <div className="max-h-80 overflow-y-auto rounded-md border border-border/50 bg-background p-3 space-y-2 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{play.ticker}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold",
              color === "purple" ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"
            )}>
              {label}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
              isNoPlay ? "bg-muted text-muted-foreground" : isBull ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
            )}
          >
            {play.strategy.replace("_", " ")}
          </span>
        </div>

        {/* Reason */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reason</p>
          <p className="text-xs leading-relaxed text-foreground">{play.reason}</p>
        </div>

        {!isNoPlay && (
          <>
            {/* Strikes */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Long Strike</p>
                <p className="font-mono text-xs font-semibold">${play.long_strike?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Short Strike</p>
                <p className="font-mono text-xs font-semibold">{play.short_strike ? `$${play.short_strike.toFixed(2)}` : "—"}</p>
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

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">POP</p>
                <p className="font-mono text-xs font-semibold">{play.probability_of_profit}%</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confidence</p>
                <p className={cn(
                  "font-mono text-xs font-semibold",
                  play.confidence >= 60 ? "text-green-400" : play.confidence >= 40 ? "text-yellow-400" : "text-red-400"
                )}>{play.confidence}%</p>
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
            
            {/* Stage button */}
            <button
              onClick={() => handleStage(play, source)}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-colors",
                color === "purple"
                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              )}
            >
              Stage Options Leg <ArrowRight className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Risk notes */}
        {play.risk_notes.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Risks</p>
            <ul className="space-y-0.5">
              {play.risk_notes.map((r, i) => (
                <li key={i} className="text-[10px] text-yellow-400">• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">AI Options Plays</h3>
        <span className="ml-auto flex gap-1">
          <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9px] text-purple-400">Claude</span>
          <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 font-mono text-[9px] text-green-400">OpenAI</span>
        </span>
      </div>

      {/* Input */}
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Paste market data (price, IV, IV percentile, underlying momentum, support/resistance, etc.)…"
        className="mb-3 h-16 w-full rounded-md border border-border bg-background p-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono"
        >
          <option value="DAILY">Daily (0-1 DTE)</option>
        <option value="WEEKLY">Weekly (2-7 DTE)</option>
        <option value="MONTHLY">Monthly (14-45 DTE)</option>
        <option value="YEARLY">Yearly (200+ DTE)</option>
        </select>
        <button
          onClick={generateBoth}
          disabled={claudeLoading || openaiLoading || !context.trim()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {claudeLoading || openaiLoading ? (
            <Loader2 className="inline h-4 w-4 animate-spin" />
          ) : (
            "Generate Plays"
          )}
        </button>
      </div>

      {/* Dual columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Claude column */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-purple-400">Claude</p>
          {renderPlay(claudePlay, claudeLoading, "claude")}
        </div>
        
        {/* OpenAI column */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-green-400">OpenAI</p>
          {renderPlay(openaiPlay, openaiLoading, "openai")}
        </div>
      </div>
    </div>
  )
}
