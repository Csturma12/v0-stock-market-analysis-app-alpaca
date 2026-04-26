"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  Zap, TrendingUp, TrendingDown, Minus, Loader2, ArrowRight,
  Target, Shield, Brain, Sparkles
} from "lucide-react"

type ClaudeIdea = {
  direction: "long" | "short" | "neutral"
  conviction: number
  thesis: string
  entry: number | null
  stop: number | null
  target: number | null
  plays?: { title: string; strike: number; expiry: string; bias: string }[]
}

type OpenAIIdea = {
  action: "BUY" | "SELL" | "NO_TRADE"
  entry: number | null
  stop: number | null
  target: number | null
  thesis: string
  confidence: number
}

export function QuickTradeIdea() {
  const [ticker, setTicker] = useState("")
  const [loading, setLoading] = useState(false)
  const [claudeIdea, setClaudeIdea] = useState<ClaudeIdea | null>(null)
  const [openaiIdea, setOpenaiIdea] = useState<OpenAIIdea | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchIdeas() {
    if (!ticker.trim()) return
    const sym = ticker.trim().toUpperCase()

    setLoading(true)
    setError(null)
    setClaudeIdea(null)
    setOpenaiIdea(null)

    try {
      const [claudeRes, openaiRes] = await Promise.all([
        fetch("/api/trade-idea", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol: sym }),
        }),
        fetch("/api/trade-idea-openai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol: sym }),
        }),
      ])

      const [claudeData, openaiData] = await Promise.all([
        claudeRes.json(),
        openaiRes.json(),
      ])

      if (claudeData.error && openaiData.error) {
        setError("Failed to generate ideas. Try again.")
      } else {
        if (!claudeData.error) setClaudeIdea(claudeData)
        if (!openaiData.error) setOpenaiIdea(openaiData)
      }
    } catch (e: any) {
      setError(e.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) fetchIdeas()
  }

  const hasResults = claudeIdea || openaiIdea

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      {/* Input row */}
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker..."
          className="flex-1 rounded-md border border-border/50 bg-background/50 px-3 py-2 font-mono text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          disabled={loading}
        />
        <button
          onClick={fetchIdeas}
          disabled={loading || !ticker.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          {loading ? "Analyzing..." : "Get Ideas"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-[color:var(--color-bear)]/10 px-3 py-2 text-xs text-[color:var(--color-bear)] mb-2">
          {error}
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {/* Claude Idea */}
          {claudeIdea && (
            <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="h-3 w-3 text-purple-400" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400">Claude</span>
                <div className={cn(
                  "ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                  claudeIdea.direction === "long" && "bg-[color:var(--color-bull)]/20 text-[color:var(--color-bull)]",
                  claudeIdea.direction === "short" && "bg-[color:var(--color-bear)]/20 text-[color:var(--color-bear)]",
                  claudeIdea.direction === "neutral" && "bg-amber-500/20 text-amber-400",
                )}>
                  {claudeIdea.direction === "long" && <TrendingUp className="h-2.5 w-2.5" />}
                  {claudeIdea.direction === "short" && <TrendingDown className="h-2.5 w-2.5" />}
                  {claudeIdea.direction === "neutral" && <Minus className="h-2.5 w-2.5" />}
                  {claudeIdea.direction}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{claudeIdea.conviction}%</span>
              </div>
              <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{claudeIdea.thesis}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
                {claudeIdea.entry && (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-2.5 w-2.5" />Entry: ${claudeIdea.entry.toFixed(2)}
                  </span>
                )}
                {claudeIdea.target && (
                  <span className="flex items-center gap-1 text-[color:var(--color-bull)]">
                    <Target className="h-2.5 w-2.5" />Target: ${claudeIdea.target.toFixed(2)}
                  </span>
                )}
                {claudeIdea.stop && (
                  <span className="flex items-center gap-1 text-[color:var(--color-bear)]">
                    <Shield className="h-2.5 w-2.5" />Stop: ${claudeIdea.stop.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* OpenAI Idea */}
          {openaiIdea && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">GPT</span>
                <div className={cn(
                  "ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                  openaiIdea.action === "BUY" && "bg-[color:var(--color-bull)]/20 text-[color:var(--color-bull)]",
                  openaiIdea.action === "SELL" && "bg-[color:var(--color-bear)]/20 text-[color:var(--color-bear)]",
                  openaiIdea.action === "NO_TRADE" && "bg-amber-500/20 text-amber-400",
                )}>
                  {openaiIdea.action === "BUY" && <TrendingUp className="h-2.5 w-2.5" />}
                  {openaiIdea.action === "SELL" && <TrendingDown className="h-2.5 w-2.5" />}
                  {openaiIdea.action === "NO_TRADE" && <Minus className="h-2.5 w-2.5" />}
                  {openaiIdea.action}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{openaiIdea.confidence}%</span>
              </div>
              <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{openaiIdea.thesis}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
                {openaiIdea.entry && (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-2.5 w-2.5" />Entry: ${openaiIdea.entry.toFixed(2)}
                  </span>
                )}
                {openaiIdea.target && (
                  <span className="flex items-center gap-1 text-[color:var(--color-bull)]">
                    <Target className="h-2.5 w-2.5" />Target: ${openaiIdea.target.toFixed(2)}
                  </span>
                )}
                {openaiIdea.stop && (
                  <span className="flex items-center gap-1 text-[color:var(--color-bear)]">
                    <Shield className="h-2.5 w-2.5" />Stop: ${openaiIdea.stop.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasResults && !error && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground/50 text-center">
            Enter a ticker to get instant<br />trade ideas from Claude & GPT
          </p>
        </div>
      )}
    </div>
  )
}
