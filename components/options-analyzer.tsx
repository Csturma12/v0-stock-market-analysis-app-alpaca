"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { BarChart3, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react"

type ContractSummary = {
  last?: number | null
  bid?: number | null
  ask?: number | null
  mid?: number | null
  iv?: number | null
  delta?: number | null
  openInterest?: number | null
  volume?: number | null
}

type ExpirySummary = {
  expiry: string
  dte: number
  strikeCount: number
  atmStrike: number
  atmCall: ContractSummary | null
  atmPut: ContractSummary | null
}

type Play = {
  title: string
  bias: "bullish" | "bearish" | "neutral" | "volatility"
  structure: string
  rationale: string
  maxLoss: string
  maxGain: string
  breakeven: string
  riskLevel: "conservative" | "moderate" | "aggressive"
}

type AnalyzerResult = {
  symbol: string
  spot: number
  realizedVol: number
  expiries: ExpirySummary[]
  analysis: {
    summary: string
    ivAssessment: "low" | "moderate" | "elevated" | "extremely_elevated"
    skew: string
    plays: Play[]
  }
}

const BIAS_ICON: Record<Play["bias"], any> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
  volatility: Activity,
}

const BIAS_COLOR: Record<Play["bias"], string> = {
  bullish: "text-[color:var(--color-bull)]",
  bearish: "text-[color:var(--color-bear)]",
  neutral: "text-muted-foreground",
  volatility: "text-amber-400",
}

const RISK_COLOR: Record<Play["riskLevel"], string> = {
  conservative: "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/5",
  moderate: "border-primary/40 bg-primary/5",
  aggressive: "border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/5",
}

export function OptionsAnalyzer() {
  const [symbol, setSymbol] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzerResult | null>(null)

  async function analyze(e?: React.FormEvent) {
    e?.preventDefault()
    if (!symbol.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/options/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Options Analyzer</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Polygon chain + Claude
        </span>
      </div>

      <form onSubmit={analyze} className="mb-5 flex gap-2">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Ticker e.g. AAPL"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono uppercase tracking-wider focus:border-primary focus:outline-none"
          maxLength={8}
        />
        <button
          type="submit"
          disabled={loading || !symbol.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-[color:var(--color-bear)]/10 p-3 text-sm text-[color:var(--color-bear)]">
          {error}
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pulls the full chain from Polygon, computes 30-day realized vol, and asks Claude to propose 2-4 concrete
          plays (conservative / moderate / aggressive) with exact strike + expiry.
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-1.5 py-4 text-sm text-muted-foreground">
          <span>Fetching spot price &amp; options chain…</span>
          <span>Computing realized volatility…</span>
          <span>Asking Claude for structured plays…</span>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-border pb-3">
            <span className="font-mono text-xl font-semibold">{result.symbol}</span>
            <span className="font-mono text-lg tabular-nums">${result.spot.toFixed(2)}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              RV30 {(result.realizedVol * 100).toFixed(1)}%
            </span>
            <span
              className={cn(
                "ml-auto rounded-md border px-2 py-0.5 font-mono text-xs uppercase tracking-widest",
                result.analysis.ivAssessment === "low" && "border-[color:var(--color-bull)]/40 text-[color:var(--color-bull)]",
                result.analysis.ivAssessment === "moderate" && "border-border text-muted-foreground",
                result.analysis.ivAssessment === "elevated" && "border-amber-400/40 text-amber-400",
                result.analysis.ivAssessment === "extremely_elevated" &&
                  "border-[color:var(--color-bear)]/40 text-[color:var(--color-bear)]",
              )}
            >
              IV {result.analysis.ivAssessment.replace("_", " ")}
            </span>
          </div>

          <p className="text-pretty leading-relaxed">{result.analysis.summary}</p>

          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Skew</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis.skew}</p>
          </div>

          {/* Expiry chain overview */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              ATM snapshot per expiry
            </h4>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/40 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Expiry</th>
                    <th className="px-3 py-2 text-right">DTE</th>
                    <th className="px-3 py-2 text-right">ATM</th>
                    <th className="px-3 py-2 text-right">Call mid</th>
                    <th className="px-3 py-2 text-right">Put mid</th>
                    <th className="px-3 py-2 text-right">Call IV</th>
                    <th className="px-3 py-2 text-right">Put IV</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs tabular-nums">
                  {result.expiries.map((e) => (
                    <tr key={e.expiry} className="border-t border-border">
                      <td className="px-3 py-1.5">{e.expiry}</td>
                      <td className="px-3 py-1.5 text-right">{e.dte}d</td>
                      <td className="px-3 py-1.5 text-right">${e.atmStrike}</td>
                      <td className="px-3 py-1.5 text-right">{fmtNum(e.atmCall?.mid)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtNum(e.atmPut?.mid)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtPct(e.atmCall?.iv)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtPct(e.atmPut?.iv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Suggested plays</h4>
            {result.analysis.plays.map((p, i) => {
              const Icon = BIAS_ICON[p.bias]
              return (
                <div key={i} className={cn("flex flex-col gap-2 rounded-md border p-4", RISK_COLOR[p.riskLevel])}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className={cn("h-4 w-4", BIAS_COLOR[p.bias])} />
                    <span className="font-semibold">{p.title}</span>
                    <span className={cn("ml-auto font-mono text-[10px] uppercase tracking-widest", BIAS_COLOR[p.bias])}>
                      {p.bias}
                    </span>
                    <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.riskLevel}
                    </span>
                  </div>
                  <div className="rounded-sm border border-border/60 bg-background p-2 font-mono text-xs">
                    {p.structure}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.rationale}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <MiniCell label="Max loss" value={p.maxLoss} />
                    <MiniCell label="Max gain" value={p.maxGain} />
                    <MiniCell label="Breakeven" value={p.breakeven} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-sm border border-border/50 bg-background px-2 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}

function fmtNum(n: number | null | undefined) {
  if (n == null) return "—"
  return `$${n.toFixed(2)}`
}
function fmtPct(n: number | null | undefined) {
  if (n == null) return "—"
  return `${(n * 100).toFixed(0)}%`
}
