"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, TrendingUp, TrendingDown, Minus, Shield, Target } from "lucide-react"

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

export function TradeIdeaPanel({ symbol }: { symbol: string }) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/trade-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setIdea(data.idea)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const directionIcon = idea?.direction === "long" ? TrendingUp : idea?.direction === "short" ? TrendingDown : Minus
  const Icon = directionIcon
  const dirColor =
    idea?.direction === "long"
      ? "text-[color:var(--color-bull)]"
      : idea?.direction === "short"
        ? "text-[color:var(--color-bear)]"
        : "text-muted-foreground"

  const reward = idea ? Math.abs(idea.target - idea.entry) : 0
  const risk = idea ? Math.abs(idea.entry - idea.stopLoss) : 0
  const rr = risk > 0 ? reward / risk : 0

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">AI Trade Idea</h3>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Claude Opus</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : idea ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-[color:var(--color-bear)]/10 p-3 text-sm text-[color:var(--color-bear)]">
          {error}
        </div>
      )}

      {!idea && !loading && !error && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Run a full agentic analysis: fundamentals + technicals + news + options chain + institutional flow + memory of
          your past trades on <span className="font-mono">{symbol}</span>. Output includes stock levels and structured
          options plays with hedges when the setup is risky.
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-2 py-4 text-sm text-muted-foreground">
          <span>Gathering Polygon snapshot &amp; options chain…</span>
          <span>Pulling Finnhub fundamentals &amp; consensus…</span>
          <span>Pulling Unusual Whales dark pool + flow…</span>
          <span>Searching web via Tavily…</span>
          <span>Loading past-trade memory…</span>
          <span>Asking Claude to synthesize + structure plays…</span>
        </div>
      )}

      {idea && (
        <div className="flex flex-col gap-5">
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
              <Icon className="h-3.5 w-3.5" />
              {idea.direction}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{idea.timeframe}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Conviction {idea.conviction}/10
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              R:R {rr.toFixed(2)}
            </span>
          </div>

          <p className="text-pretty leading-relaxed">{idea.thesis}</p>

          <div className="grid grid-cols-3 gap-3">
            <Cell label="Entry" value={`$${idea.entry.toFixed(2)}`} />
            <Cell label="Stop" value={`$${idea.stopLoss.toFixed(2)}`} color="text-[color:var(--color-bear)]" />
            <Cell label="Target" value={`$${idea.target.toFixed(2)}`} color="text-[color:var(--color-bull)]" />
          </div>

          {idea.plays && idea.plays.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Structured plays</h4>
              <div className="flex flex-col gap-3">
                {idea.plays.map((p, idx) => (
                  <PlayCard key={idx} symbol={symbol} play={p} />
                ))}
              </div>
            </div>
          )}

          {(() => {
            const side = idea.direction === "short" ? "sell" : "buy"
            const suggestedQty = Math.max(1, Math.floor(500 / Math.max(idea.entry, 1)))
            const params = new URLSearchParams({
              symbol,
              side,
              qty: String(suggestedQty),
              type: "limit",
              limit: idea.entry.toFixed(2),
              stop: idea.stopLoss.toFixed(2),
              target: idea.target.toFixed(2),
              thesis: idea.thesis.slice(0, 180),
            })
            return (
              <a
                href={`/trading?${params.toString()}`}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Stage stock leg: {side.toUpperCase()} {suggestedQty} {symbol} @ ${idea.entry.toFixed(2)} →
              </a>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function PlayCard({ symbol, play }: { symbol: string; play: Play }) {
  const isHedge = play.role === "hedge"
  const RoleIcon = isHedge ? Shield : Target
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4",
        isHedge
          ? "border-amber-400/40 bg-amber-400/5"
          : "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RoleIcon
          className={cn("h-4 w-4", isHedge ? "text-amber-400" : "text-primary")}
        />
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
              ? `Debit $${Math.abs(play.netDebitCredit).toFixed(2)}`
              : `Credit $${Math.abs(play.netDebitCredit).toFixed(2)}`}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{play.thesis}</p>

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
              <span className="ml-auto text-muted-foreground">@ ${leg.limitPrice.toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <StatCell label="Max loss" value={play.maxLoss} />
        <StatCell label="Max gain" value={play.maxGain} />
        <StatCell label="Breakeven" value={play.breakeven} />
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-sm border border-border/50 bg-background px-2 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/60 bg-background px-3 py-2.5">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-lg font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}
function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-muted-foreground">·</span>
            <span className="text-pretty">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
