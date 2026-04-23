"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"

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

      {error && <div className="rounded-md bg-[color:var(--color-bear)]/10 p-3 text-sm text-[color:var(--color-bear)]">{error}</div>}

      {!idea && !loading && !error && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Run a full agentic analysis: fundamentals + technicals + news + web search + memory of your past trades on{" "}
          <span className="font-mono">{symbol}</span>. Result is persisted so the system learns from outcomes.
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-2 py-4 text-sm text-muted-foreground">
          <span>Gathering Polygon snapshot…</span>
          <span>Pulling Finnhub fundamentals &amp; consensus…</span>
          <span>Searching web via Tavily…</span>
          <span>Loading past-trade memory…</span>
          <span>Asking Claude to synthesize…</span>
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

          <p className="text-pretty leading-relaxed">{idea.thesis}</p>

          <div className="grid grid-cols-3 gap-3">
            <Cell label="Entry" value={`$${idea.entry.toFixed(2)}`} />
            <Cell label="Stop" value={`$${idea.stopLoss.toFixed(2)}`} color="text-[color:var(--color-bear)]" />
            <Cell label="Target" value={`$${idea.target.toFixed(2)}`} color="text-[color:var(--color-bull)]" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Block title="Catalysts" items={idea.catalysts} />
            <Block title="Risks" items={idea.risks} />
          </div>

          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Key metrics</h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {idea.keyMetrics.map((m) => (
                <div key={m.label} className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-background px-3 py-2">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className="font-mono text-sm font-medium tabular-nums">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const side = idea.direction === "short" ? "sell" : "buy"
            // Default position size: $500 notional, capped by reasonable share count
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
                Stage {side.toUpperCase()} {suggestedQty} {symbol} @ ${idea.entry.toFixed(2)} →
              </a>
            )
          })()}
        </div>
      )}
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
