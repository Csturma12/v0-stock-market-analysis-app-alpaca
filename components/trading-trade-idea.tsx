"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

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

type Idea = {
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

export function TradingTradeIdea({
  onStageOrder,
}: {
  onStageOrder: (params: {
    symbol: string
    side: "buy" | "sell"
    qty: number
    type: "limit" | "market"
    limitPrice?: number
    stop?: number
    target?: number
    thesis?: string
    isOption?: boolean
    optionStrike?: number
    optionExpiry?: string
    optionType?: "call" | "put"
    optionAction?: "buy" | "sell"
    optionQty?: number
    optionLimit?: number
  }) => void
}) {
  const [ticker, setTicker] = useState("")
  const [symbol, setSymbol] = useState("")
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function generate(sym: string) {
    if (!sym.trim()) return
    setLoading(true)
    setError(null)
    setIdea(null)
    setSymbol(sym.trim().toUpperCase())
    try {
      const res = await fetch("/api/trade-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: sym.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setIdea(data.idea)
        setExpanded(true)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const dirColor =
    idea?.direction === "long"
      ? "text-[color:var(--color-bull)]"
      : idea?.direction === "short"
        ? "text-[color:var(--color-bear)]"
        : "text-muted-foreground"

  const reward = idea ? Math.abs(idea.target - idea.entry) : 0
  const risk = idea ? Math.abs(idea.entry - idea.stopLoss) : 0
  const rr = risk > 0 ? reward / risk : 0

  const DirIcon = idea?.direction === "long" ? TrendingUp : idea?.direction === "short" ? TrendingDown : Minus

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="font-semibold">AI Trade Idea Generator</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Claude Opus</span>
        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              generate(ticker)
            }}
            className="flex items-center gap-2"
          >
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className="w-28 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm uppercase outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : idea ? "Regenerate" : "Generate Idea"}
            </button>
          </form>
          {idea && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {error && (
          <div className="rounded-md bg-[color:var(--color-bear)]/10 p-3 text-sm text-[color:var(--color-bear)]">
            {error}
          </div>
        )}

        {!idea && !loading && !error && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter a ticker and generate a full agentic analysis — fundamentals, technicals, dark pool flow, options
            chain, news — structured into stock + options plays with hedges.
          </p>
        )}

        {loading && (
          <div className="flex flex-col gap-1.5 py-2">
            {[
              "Fetching snapshot, options chain & financials…",
              "Pulling Unusual Whales dark pool + flow…",
              "Searching recent news & catalysts…",
              "Loading past-trade memory…",
              "Asking Claude to structure plays…",
            ].map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                {s}
              </div>
            ))}
          </div>
        )}

        {idea && expanded && (
          <div className="flex flex-col gap-5">
            {/* Direction / meta badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs uppercase tracking-widest",
                  idea.direction === "long" && "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/10",
                  idea.direction === "short" && "border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10",
                  idea.direction === "neutral" && "border-border bg-muted",
                  dirColor,
                )}
              >
                <DirIcon className="h-3.5 w-3.5" />
                {idea.direction}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {idea.timeframe}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Conviction {idea.conviction}/10
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                R:R {rr.toFixed(2)}
              </span>
            </div>

            {/* Thesis */}
            <p className="text-pretty leading-relaxed">{idea.thesis}</p>

            {/* Entry / Stop / Target */}
            <div className="grid grid-cols-3 gap-3">
              <IdeaCell label="Entry" value={`$${idea.entry.toFixed(2)}`} />
              <IdeaCell
                label="Stop"
                value={`$${idea.stopLoss.toFixed(2)}`}
                color="text-[color:var(--color-bear)]"
              />
              <IdeaCell
                label="Target"
                value={`$${idea.target.toFixed(2)}`}
                color="text-[color:var(--color-bull)]"
              />
            </div>

            {/* Structured plays */}
            {idea.plays && idea.plays.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Structured plays
                </h4>
                {idea.plays.map((play, idx) => (
                  <TradingPlayCard
                    key={idx}
                    symbol={symbol}
                    play={play}
                    idea={idea}
                    onStageOrder={onStageOrder}
                  />
                ))}
              </div>
            )}

            {/* Catalysts / Risks */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <IdeaBlock title="Catalysts" items={idea.catalysts} />
              <IdeaBlock title="Risks" items={idea.risks} />
            </div>

            {/* Key metrics */}
            {idea.keyMetrics.length > 0 && (
              <div>
                <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Key metrics
                </h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {idea.keyMetrics.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-background px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                      <span className="font-mono text-sm font-medium tabular-nums">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed summary */}
        {idea && !expanded && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span
              className={cn(
                "font-mono font-semibold",
                dirColor,
              )}
            >
              {symbol} · {idea.direction.toUpperCase()}
            </span>
            <span className="text-muted-foreground">Entry ${idea.entry.toFixed(2)}</span>
            <span className="text-[color:var(--color-bear)]">Stop ${idea.stopLoss.toFixed(2)}</span>
            <span className="text-[color:var(--color-bull)]">Target ${idea.target.toFixed(2)}</span>
            <span className="text-muted-foreground">Conv {idea.conviction}/10</span>
            <span className="text-muted-foreground">R:R {rr.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TradingPlayCard({
  symbol,
  play,
  idea,
  onStageOrder,
}: {
  symbol: string
  play: Play
  idea: Idea
  onStageOrder: (params: any) => void
}) {
  const isHedge = play.role === "hedge"
  const RoleIcon = isHedge ? Shield : Target

  function stagePlay() {
    const firstLeg = play.legs[0]
    if (!firstLeg) return

    if (firstLeg.instrument === "stock") {
      const suggestedQty = Math.max(1, Math.floor(1000 / Math.max(idea.entry, 1)))
      onStageOrder({
        symbol,
        side: firstLeg.action,
        qty: firstLeg.qty > 0 ? firstLeg.qty : suggestedQty,
        type: "limit",
        limitPrice: firstLeg.limitPrice ?? idea.entry,
        stop: idea.stopLoss,
        target: idea.target,
        thesis: play.thesis.slice(0, 180),
      })
    } else {
      // Options leg
      onStageOrder({
        symbol,
        side: firstLeg.action,
        qty: firstLeg.qty || 1,
        type: firstLeg.limitPrice ? "limit" : "market",
        thesis: play.thesis.slice(0, 180),
        isOption: true,
        optionType: firstLeg.instrument as "call" | "put",
        optionStrike: firstLeg.strike ?? undefined,
        optionExpiry: firstLeg.expiry ?? undefined,
        optionAction: firstLeg.action,
        optionQty: firstLeg.qty || 1,
        optionLimit: firstLeg.limitPrice ?? undefined,
      })
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4",
        isHedge ? "border-amber-400/40 bg-amber-400/5" : "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RoleIcon className={cn("h-4 w-4", isHedge ? "text-amber-400" : "text-primary")} />
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest",
            isHedge ? "text-amber-400" : "text-primary",
          )}
        >
          {play.role}
        </span>
        <span className="font-semibold">{STRATEGY_LABELS[play.strategy] ?? play.strategy}</span>
        {play.netDebitCredit != null && (
          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {play.netDebitCredit >= 0
              ? `Debit $${Math.abs(play.netDebitCredit).toLocaleString()}`
              : `Credit $${Math.abs(play.netDebitCredit).toLocaleString()}`}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{play.thesis}</p>

      {/* Legs */}
      <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background p-3 font-mono text-xs">
        {play.legs.map((leg, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 tabular-nums">
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest",
                leg.action === "buy"
                  ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]"
                  : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
              )}
            >
              {leg.action}
            </span>
            <span className="text-muted-foreground">{leg.qty}x</span>
            <span className="font-semibold">{symbol}</span>
            {leg.instrument !== "stock" && (
              <>
                <span>${leg.strike}</span>
                <span className="uppercase">{leg.instrument}</span>
                <span className="text-muted-foreground">{leg.expiry}</span>
              </>
            )}
            {leg.limitPrice != null && (
              <span className="ml-auto text-muted-foreground">@ ${Number(leg.limitPrice).toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Max loss / gain / breakeven */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <PlayStat label="Max loss" value={play.maxLoss} />
        <PlayStat label="Max gain" value={play.maxGain} />
        <PlayStat label="Breakeven" value={play.breakeven} />
      </div>

      {/* Stage button */}
      <button
        onClick={stagePlay}
        className={cn(
          "mt-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
          isHedge
            ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
            : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
        )}
      >
        Stage this play in order form →
      </button>
    </div>
  )
}

function PlayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-sm border border-border/50 bg-background px-2 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}

function IdeaCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/60 bg-background px-3 py-2.5">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-lg font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}

function IdeaBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-muted-foreground">·</span>
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
