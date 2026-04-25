"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Brain, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type TradeIdea = {
  ticker: string
  action: "BUY" | "SELL" | "NO_TRADE"
  setup_type: string
  entry: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_reward: number | null
  confidence: number
  position_bias: string
  reason: string
  risk_notes: string[]
  execution_notes: string[]
}

export function DualTradeIdeaGenerator() {
  const [context, setContext] = useState("")
  const [claudeIdea, setClaudeIdea] = useState<TradeIdea | null>(null)
  const [openaiIdea, setOpenaiIdea] = useState<TradeIdea | null>(null)
  const [loading, setLoading] = useState(false)

  const generateIdeas = async () => {
    if (!context.trim()) return
    setLoading(true)
    try {
      // Fetch both in parallel
      const [claudeRes, openaiRes] = await Promise.all([
        fetch("/api/trade-idea", { method: "POST", body: JSON.stringify({ context }) }),
        fetch("/api/trade-idea-openai", { method: "POST", body: JSON.stringify({ context }) }),
      ])

      const claudeData = await claudeRes.json()
      const openaiData = await openaiRes.json()

      setClaudeIdea(claudeData)
      setOpenaiIdea(openaiData)
    } catch (err) {
      console.error("[v0] Error generating ideas:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Dual AI Trade Ideas</h3>
      </div>

      {/* Input */}
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Paste market data context (price, volume, technicals, etc.)…"
        className="mb-3 h-20 w-full rounded-md border border-border bg-background p-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={generateIdeas}
        disabled={loading || !context.trim()}
        className="mb-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {loading ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : "Generate Ideas"}
      </button>

      {/* Side-by-side results */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Claude */}
        <div className="max-h-96 overflow-y-auto rounded-md border border-border/50 bg-background p-3">
          <div className="mb-2 font-mono text-xs font-semibold text-purple-400">Claude</div>
          {claudeIdea ? (
            <IdeaDisplay idea={claudeIdea} />
          ) : (
            <p className="text-xs text-muted-foreground">Generate to see Claude's idea</p>
          )}
        </div>

        {/* OpenAI */}
        <div className="max-h-96 overflow-y-auto rounded-md border border-border/50 bg-background p-3">
          <div className="mb-2 font-mono text-xs font-semibold text-green-400">OpenAI</div>
          {openaiIdea ? (
            <IdeaDisplay idea={openaiIdea} />
          ) : (
            <p className="text-xs text-muted-foreground">Generate to see OpenAI's idea</p>
          )}
        </div>
      </div>
    </div>
  )
}

function IdeaDisplay({ idea }: { idea: TradeIdea }) {
  const isNoTrade = idea.action === "NO_TRADE"
  const isBull = idea.position_bias === "bullish"

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold">{idea.ticker}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
            isNoTrade ? "bg-muted text-muted-foreground" : isBull ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
          )}
        >
          {idea.action}
        </span>
      </div>

      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reason</p>
        <p className="text-xs leading-relaxed text-foreground">{idea.reason}</p>
      </div>

      {!isNoTrade && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Entry</p>
              <p className="font-mono text-xs font-semibold">${idea.entry?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Stop</p>
              <p className="font-mono text-xs font-semibold">${idea.stop_loss?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Target</p>
              <p className="font-mono text-xs font-semibold">${idea.take_profit?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">R:R</p>
              <p className="font-mono text-xs font-semibold">{idea.risk_reward?.toFixed(2)}x</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confidence</p>
            <p className="font-mono text-xs font-semibold">{idea.confidence}%</p>
          </div>
        </>
      )}

      {idea.risk_notes.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Risks</p>
          <ul className="space-y-1">
            {idea.risk_notes.map((r, i) => (
              <li key={i} className="text-[10px] text-yellow-400">
                • {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
