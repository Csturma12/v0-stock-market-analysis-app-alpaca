"use client"

import { useEffect, useState } from "react"
import type { DetectedPattern, PatternDiagnostic } from "@/lib/pattern-detector"
import { AlertCircle, TrendingUp, BarChart3, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function TickerPatterns({ symbol }: { symbol: string }) {
  const [patterns, setPatterns] = useState<(DetectedPattern & { autonomyScore: number })[]>([])
  const [diagnostics, setDiagnostics] = useState<PatternDiagnostic[]>([])
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectPatterns = async () => {
      try {
        const res = await fetch(`/api/ticker/${symbol}/patterns`)
        const data = await res.json()

        if (res.ok) {
          setPatterns(data.patterns || [])
          setDiagnostics(data.diagnostics || [])
          setSummary(data.summary || "")
        } else {
          setError(data.error || "Failed to analyze patterns")
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    if (symbol) detectPatterns()
  }, [symbol])

  if (loading) return <div className="text-sm text-muted-foreground">Analyzing patterns...</div>
  if (error) return <div className="text-xs text-muted-foreground">{error}</div>

  // No patterns found - show diagnostic reasons
  if (!patterns.length) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Pattern Analysis</h3>
        </div>

        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-sm text-muted-foreground mb-3">{summary}</p>
          
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Why no patterns?</p>
            {diagnostics.filter(d => !d.reason.startsWith("Pattern detected")).map((diag, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-foreground whitespace-nowrap">{diag.pattern}:</span>
                <span className="text-muted-foreground">{diag.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-400" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Tradeable Patterns</h3>
      </div>

      <div className="space-y-2">
        {patterns.map((pattern, idx) => (
          <PatternCard key={idx} pattern={pattern} />
        ))}
      </div>
    </section>
  )
}

function PatternCard({ pattern }: { pattern: DetectedPattern & { autonomyScore: number } }) {
  const iconProps = "h-4 w-4"

  const Icon =
    pattern.type === "uptrend_pullback"
      ? TrendingUp
      : pattern.type === "mean_reversion"
        ? BarChart3
        : pattern.type === "range_bound"
          ? BarChart3
          : pattern.type === "accumulation"
            ? Zap
            : AlertCircle

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        pattern.autonomyScore >= 70 ? "border-[color:var(--color-bull)]/50 bg-[color:var(--color-bull)]/5" : "border-border bg-card/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Icon className={cn(iconProps, pattern.autonomyScore >= 70 ? "text-[color:var(--color-bull)]" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{pattern.name}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{pattern.description}</p>
          </div>
        </div>

        {/* Autonomy Score Badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className={cn(
              "rounded-full px-2 py-1 text-xs font-mono font-bold",
              pattern.autonomyScore >= 70
                ? "bg-[color:var(--color-bull)]/20 text-[color:var(--color-bull)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {Math.round(pattern.autonomyScore)}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">auto score</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <span className="text-muted-foreground">Win Rate:</span>
          <span className="ml-1 font-mono font-semibold">{pattern.winRate}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Avg Return:</span>
          <span className={cn("ml-1 font-mono font-semibold", pattern.avgReturn > 0 ? "text-[color:var(--color-bull)]" : "text-red-500")}>
            {pattern.avgReturn > 0 ? "+" : ""}
            {pattern.avgReturn.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Frequency:</span>
          <span className="ml-1 font-mono font-semibold capitalize">{pattern.frequency}</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-2 rounded bg-muted/50 p-2">
        <p className="text-[11px] leading-snug text-muted-foreground">
          <strong className="text-foreground">Play:</strong> {pattern.recommendation}
        </p>
      </div>
    </div>
  )
}
