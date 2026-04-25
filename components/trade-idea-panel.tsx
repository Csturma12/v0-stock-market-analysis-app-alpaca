"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, TrendingUp, TrendingDown, Minus, Shield, Target, Brain } from "lucide-react"

type Leg = {
  action: "buy" | "sell"
  instrument: "stock" | "call" | "put"
  strike?: number | null
  expiry?: string | null
  qty: number
  limitPrice?: number | null
}

type Play = {
  role: "primary" | "hedge"
  strategy: string
  thesis: string
  legs: Leg[]
  maxLoss: string
  maxGain: string
  breakeven: string
  netDebitCredit?: number | null
}

type ClaudeIdea = {
  thesis: string
  direction: "long" | "short" | "neutral"
  conviction: number
  entry: number
  stopLoss: number
  target: number
  timeframe: "intraday" | "swing" | "position"
  risks: string[]
  catalysts: string[]
  keyMetrics: { label: string; value: string }[]
  plays?: Play[]
}

type OpenAIIdea = {
  ticker: string
  action: "BUY" | "SELL" | "NO_TRADE"
  setup_type: string
  entry: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_reward: number | null
  confidence: number
  position_bias: "bullish" | "bearish" | "neutral"
  reason: string
  invalid_if: string
  risk_notes: string[]
  execution_notes: string[]
}

const STRATEGY_LABELS: Record<string, string> = {
  long_stock: "Long Stock",
  short_stock: "Short Stock",
  long_call: "Long Call",
  long_put: "Long Put",
  stock_plus_long_call: "Stock + Long Call",
  stock_plus_long_put: "Stock + Long Put",
  protective_put: "Protective Put",
  covered_call: "Covered Call",
  collar: "Collar",
  call_spread: "Call Spread",
  put_spread: "Put Spread",
}

export function TradeIdeaPanel({ symbol }: { symbol: string }) {
  const [claudeIdea, setClaudeIdea] = useState<ClaudeIdea | null>(null)
  const [openaiIdea, setOpenaiIdea] = useState<OpenAIIdea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    setClaudeIdea(null)
    setOpenaiIdea(null)

    try {
      // Fetch both Claude and OpenAI ideas in parallel
      const [claudeRes, openaiRes] = await Promise.all([
        fetch("/api/trade-idea", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol }),
        }),
        fetch("/api/trade-idea-openai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol }),
        }),
      ])

      const [claudeData, openaiData] = await Promise.all([
        claudeRes.json(),
        openaiRes.json(),
      ])

      if (claudeData.error && openaiData.error) {
        setError("Both AI models failed to generate ideas")
      } else {
        if (claudeData.idea) setClaudeIdea(claudeData.idea)
        if (!openaiData.error) setOpenaiIdea(openaiData)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const hasIdeas = claudeIdea || openaiIdea

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Trade Idea</h3>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : hasIdeas ? "Regenerate" : "Generate"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="rounded-md bg-[color:var(--color-bear)]/10 p-3 text-sm text-[color:var(--color-bear)]">
            {error}
          </div>
        )}

        {!hasIdeas && !loading && !error && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Run a full agentic analysis: fundamentals + technicals + news + options chain + institutional flow. 
            Click Generate to get trade ideas from both <span className="font-semibold text-purple-400">Claude</span> and <span className="font-semibold text-emerald-400">OpenAI</span>.
          </p>
        )}

        {loading && (
          <div className="flex flex-col gap-2 py-4 text-xs text-muted-foreground">
            <span>Gathering Polygon snapshot & options chain…</span>
            <span>Pulling Finnhub fundamentals & consensus…</span>
            <span>Pulling Unusual Whales dark pool + flow…</span>
            <span>Searching web via Tavily…</span>
            <span>Asking Claude & OpenAI to synthesize…</span>
          </div>
        )}

        {hasIdeas && (
          <div className="flex flex-col gap-4">
            {/* Claude Idea */}
            {claudeIdea && (
              <ClaudeIdeaCard symbol={symbol} idea={claudeIdea} />
            )}

            {/* OpenAI Idea */}
            {openaiIdea && (
              <OpenAIIdeaCard idea={openaiIdea} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ClaudeIdeaCard({ symbol, idea }: { symbol: string; idea: ClaudeIdea }) {
  const directionIcon = idea.direction === "long" ? TrendingUp : idea.direction === "short" ? TrendingDown : Minus
  const Icon = directionIcon
  const dirColor =
    idea.direction === "long"
      ? "text-[color:var(--color-bull)]"
      : idea.direction === "short"
        ? "text-[color:var(--color-bear)]"
        : "text-muted-foreground"

  const reward = Math.abs(idea.target - idea.entry)
  const risk = Math.abs(idea.entry - idea.stopLoss)
  const rr = risk > 0 ? reward / risk : 0

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-400" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-purple-400">Claude Opus</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
            idea.direction === "long" && "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/10",
            idea.direction === "short" && "border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10",
            idea.direction === "neutral" && "border-border bg-muted",
            dirColor,
          )}
        >
          <Icon className="h-3 w-3" />
          {idea.direction}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{idea.timeframe}</span>
        <span className="font-mono text-[10px] text-muted-foreground">Conv: {idea.conviction}/10</span>
        <span className="font-mono text-[10px] text-muted-foreground">R:R {rr.toFixed(1)}</span>
      </div>

      <p className="text-xs leading-relaxed text-foreground/90 mb-3">{idea.thesis}</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <MiniCell label="Entry" value={`$${idea.entry.toFixed(2)}`} />
        <MiniCell label="Stop" value={`$${idea.stopLoss.toFixed(2)}`} color="text-[color:var(--color-bear)]" />
        <MiniCell label="Target" value={`$${idea.target.toFixed(2)}`} color="text-[color:var(--color-bull)]" />
      </div>

      {idea.plays && idea.plays.length > 0 && (
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Plays</span>
          {idea.plays.map((p, idx) => (
            <MiniPlayCard key={idx} symbol={symbol} play={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function OpenAIIdeaCard({ idea }: { idea: OpenAIIdea }) {
  const isBullish = idea.position_bias === "bullish"
  const isBearish = idea.position_bias === "bearish"

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">OpenAI GPT-4</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
            isBullish && "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]",
            isBearish && "border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]",
            !isBullish && !isBearish && "border-border bg-muted text-muted-foreground",
          )}
        >
          {isBullish ? <TrendingUp className="h-3 w-3" /> : isBearish ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {idea.action}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{idea.setup_type}</span>
        <span className="font-mono text-[10px] text-muted-foreground">Conf: {idea.confidence}%</span>
        {idea.risk_reward && (
          <span className="font-mono text-[10px] text-muted-foreground">R:R {idea.risk_reward.toFixed(1)}</span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-foreground/90 mb-3">{idea.reason}</p>

      {(idea.entry || idea.stop_loss || idea.take_profit) && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniCell label="Entry" value={idea.entry ? `$${idea.entry.toFixed(2)}` : "—"} />
          <MiniCell label="Stop" value={idea.stop_loss ? `$${idea.stop_loss.toFixed(2)}` : "—"} color="text-[color:var(--color-bear)]" />
          <MiniCell label="Target" value={idea.take_profit ? `$${idea.take_profit.toFixed(2)}` : "—"} color="text-[color:var(--color-bull)]" />
        </div>
      )}

      {idea.risk_notes && idea.risk_notes.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Risks:</span> {idea.risk_notes.slice(0, 2).join("; ")}
        </div>
      )}

      {idea.invalid_if && (
        <div className="mt-1 text-[10px] text-amber-400">
          <span className="font-semibold">Invalid if:</span> {idea.invalid_if}
        </div>
      )}
    </div>
  )
}

function MiniPlayCard({ symbol, play }: { symbol: string; play: Play }) {
  const isHedge = play.role === "hedge"
  const RoleIcon = isHedge ? Shield : Target
  return (
    <div
      className={cn(
        "rounded-md border p-2 text-xs",
        isHedge ? "border-amber-400/30 bg-amber-400/5" : "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <RoleIcon className={cn("h-3 w-3", isHedge ? "text-amber-400" : "text-primary")} />
        <span className={cn("font-mono text-[9px] uppercase", isHedge ? "text-amber-400" : "text-primary")}>
          {play.role}
        </span>
        <span className="font-medium">{STRATEGY_LABELS[play.strategy] ?? play.strategy}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{play.thesis}</p>
      <div className="mt-1 flex gap-2 text-[9px] text-muted-foreground">
        <span>Max Loss: {play.maxLoss}</span>
        <span>Max Gain: {play.maxGain}</span>
      </div>
    </div>
  )
}

function MiniCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/50 bg-background px-2 py-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}
