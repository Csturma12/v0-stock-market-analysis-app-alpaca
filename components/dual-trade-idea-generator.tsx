"use client"

import { useState } from "react"
import { Brain, Loader2, TrendingUp, Zap, Shield, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStagedTrades, StagedStockTrade, StagedOptionsTrade } from "@/lib/staged-trade-context"

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

type OptionsIdea = {
  ticker: string
  strategy: string
  expiry: string
  long_strike: number | null
  short_strike: number | null
  max_profit: number | null
  max_loss: number | null
  probability_of_profit: number
  confidence: number
  bias: "bullish" | "bearish" | "neutral"
  reason: string
  risk_notes: string[]
}

type TabType = "stock" | "options" | "hedge"

export function DualTradeIdeaGenerator() {
  const [tab, setTab] = useState<TabType>("stock")
  const [context, setContext] = useState("")
  const [loading, setLoading] = useState(false)

  // Stock ideas
  const [claudeStock, setClaudeStock] = useState<TradeIdea | null>(null)
  const [openaiStock, setOpenaiStock] = useState<TradeIdea | null>(null)

  // Options ideas
  const [claudeOptions, setClaudeOptions] = useState<OptionsIdea | null>(null)
  const [openaiOptions, setOpenaiOptions] = useState<OptionsIdea | null>(null)

  // Hedge ideas (stock + protective option)
  const [claudeHedge, setClaudeHedge] = useState<{ stock: TradeIdea; option: OptionsIdea } | null>(null)
  const [openaiHedge, setOpenaiHedge] = useState<{ stock: TradeIdea; option: OptionsIdea } | null>(null)

  const { stageStock, stageOptions, stageHedge } = useStagedTrades()

  const generate = async () => {
    if (!context.trim()) return
    setLoading(true)
    try {
      if (tab === "stock") {
        const [claudeRes, openaiRes] = await Promise.all([
          fetch("/api/trade-idea", { method: "POST", body: JSON.stringify({ context, type: "stock" }) }),
          fetch("/api/trade-idea-openai", { method: "POST", body: JSON.stringify({ context, type: "stock" }) }),
        ])
        setClaudeStock(await claudeRes.json())
        setOpenaiStock(await openaiRes.json())
      } else if (tab === "options") {
        const [claudeRes, openaiRes] = await Promise.all([
          fetch("/api/options-play", { method: "POST", body: JSON.stringify({ context, expiry: "WEEKLY" }) }),
          fetch("/api/trade-idea-openai", { method: "POST", body: JSON.stringify({ context, type: "options" }) }),
        ])
        setClaudeOptions(await claudeRes.json())
        setOpenaiOptions(await openaiRes.json())
      } else {
        // Hedge: generate stock + protective option
        const [claudeStockRes, claudeOptRes, openaiStockRes, openaiOptRes] = await Promise.all([
          fetch("/api/trade-idea", { method: "POST", body: JSON.stringify({ context, type: "stock" }) }),
          fetch("/api/options-play", { method: "POST", body: JSON.stringify({ context, expiry: "WEEKLY", hedge: true }) }),
          fetch("/api/trade-idea-openai", { method: "POST", body: JSON.stringify({ context, type: "stock" }) }),
          fetch("/api/trade-idea-openai", { method: "POST", body: JSON.stringify({ context, type: "options", hedge: true }) }),
        ])
        setClaudeHedge({ stock: await claudeStockRes.json(), option: await claudeOptRes.json() })
        setOpenaiHedge({ stock: await openaiStockRes.json(), option: await openaiOptRes.json() })
      }
    } catch (err) {
      console.error("[v0] Error generating ideas:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStageStock = (idea: TradeIdea, source: "claude" | "openai") => {
    if (!idea || idea.action === "NO_TRADE") return
    const staged: StagedStockTrade = {
      source,
      ticker: idea.ticker,
      action: idea.action,
      entry: idea.entry,
      stop_loss: idea.stop_loss,
      take_profit: idea.take_profit,
      qty: 100,
      thesis: idea.reason,
      timestamp: Date.now(),
    }
    stageStock(staged)
  }

  const handleStageOptions = (idea: OptionsIdea, source: "claude" | "openai") => {
    if (!idea || idea.strategy === "NO_PLAY") return
    const staged: StagedOptionsTrade = {
      source,
      ticker: idea.ticker,
      strategy: idea.strategy,
      bias: idea.bias,
      expiry: idea.expiry,
      legs: [
        { action: "buy", instrument: idea.bias === "bearish" ? "put" : "call", strike: idea.long_strike ?? 0, qty: 1 },
        ...(idea.short_strike ? [{ action: "sell" as const, instrument: (idea.bias === "bearish" ? "put" : "call") as "call" | "put", strike: idea.short_strike, qty: 1 }] : []),
      ],
      thesis: idea.reason,
      timestamp: Date.now(),
    }
    stageOptions(staged)
  }

  const tabs: { key: TabType; label: string; icon: typeof TrendingUp }[] = [
    { key: "stock", label: "Stock / ETF", icon: TrendingUp },
    { key: "options", label: "Options", icon: Zap },
    { key: "hedge", label: "Hedge", icon: Shield },
  ]

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Dual AI Trade Ideas</h3>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Input */}
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={`Paste market data for ${tab === "stock" ? "stock/ETF" : tab === "options" ? "options" : "hedged"} trade ideas...`}
          className="mb-3 h-20 w-full rounded-md border border-border bg-background p-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <button
          onClick={generate}
          disabled={loading || !context.trim()}
          className="mb-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : `Generate ${tabs.find((t) => t.key === tab)?.label} Ideas`}
        </button>

        {/* Side-by-side results */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Claude Column */}
          <div className="max-h-[400px] overflow-y-auto rounded-md border border-purple-500/30 bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-purple-400">Claude</span>
            </div>
            {tab === "stock" && claudeStock ? (
              <StockIdeaDisplay idea={claudeStock} onStage={() => handleStageStock(claudeStock, "claude")} />
            ) : tab === "options" && claudeOptions ? (
              <OptionsIdeaDisplay idea={claudeOptions} onStage={() => handleStageOptions(claudeOptions, "claude")} />
            ) : tab === "hedge" && claudeHedge ? (
              <HedgeIdeaDisplay hedge={claudeHedge} source="claude" />
            ) : (
              <p className="text-xs text-muted-foreground">Generate to see Claude&apos;s idea</p>
            )}
          </div>

          {/* OpenAI Column */}
          <div className="max-h-[400px] overflow-y-auto rounded-md border border-green-500/30 bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-green-400">OpenAI</span>
            </div>
            {tab === "stock" && openaiStock ? (
              <StockIdeaDisplay idea={openaiStock} onStage={() => handleStageStock(openaiStock, "openai")} />
            ) : tab === "options" && openaiOptions ? (
              <OptionsIdeaDisplay idea={openaiOptions} onStage={() => handleStageOptions(openaiOptions, "openai")} />
            ) : tab === "hedge" && openaiHedge ? (
              <HedgeIdeaDisplay hedge={openaiHedge} source="openai" />
            ) : (
              <p className="text-xs text-muted-foreground">Generate to see OpenAI&apos;s idea</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StockIdeaDisplay({ idea, onStage }: { idea: TradeIdea; onStage: () => void }) {
  const isNoTrade = idea.action === "NO_TRADE"
  const isBull = idea.position_bias === "bullish"

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold">{idea.ticker}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
            isNoTrade ? "bg-muted text-muted-foreground" : isBull ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}
        >
          {idea.action}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{idea.reason}</p>

      {!isNoTrade && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Entry" value={`$${idea.entry?.toFixed(2)}`} />
            <Stat label="Stop" value={`$${idea.stop_loss?.toFixed(2)}`} />
            <Stat label="Target" value={`$${idea.take_profit?.toFixed(2)}`} />
            <Stat label="R:R" value={`${idea.risk_reward?.toFixed(2)}x`} />
          </div>

          <button
            onClick={onStage}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <ArrowRight className="h-3 w-3" />
            Stage Stock Leg
          </button>
        </>
      )}
    </div>
  )
}

function OptionsIdeaDisplay({ idea, onStage }: { idea: OptionsIdea; onStage: () => void }) {
  const isNoPlay = idea.strategy === "NO_PLAY"
  const isBull = idea.bias === "bullish"

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold">{idea.ticker}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
            isNoPlay ? "bg-muted text-muted-foreground" : isBull ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}
        >
          {idea.strategy}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{idea.reason}</p>

      {!isNoPlay && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Long Strike" value={`$${idea.long_strike?.toFixed(2)}`} />
            <Stat label="Short Strike" value={idea.short_strike ? `$${idea.short_strike.toFixed(2)}` : "—"} />
            <Stat label="Max Profit" value={`$${idea.max_profit?.toFixed(2)}`} color="text-green-400" />
            <Stat label="Max Loss" value={`$${idea.max_loss?.toFixed(2)}`} color="text-red-400" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="POP" value={`${idea.probability_of_profit}%`} />
            <Stat label="Confidence" value={`${idea.confidence}%`} />
            <Stat label="Expiry" value={idea.expiry} />
          </div>

          <button
            onClick={onStage}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
          >
            <ArrowRight className="h-3 w-3" />
            Stage Options Leg
          </button>
        </>
      )}
    </div>
  )
}

function HedgeIdeaDisplay({ hedge, source }: { hedge: { stock: TradeIdea; option: OptionsIdea }; source: "claude" | "openai" }) {
  const { stageHedge } = useStagedTrades()

  const handleStageHedge = () => {
    stageHedge({
      source,
      ticker: hedge.stock.ticker,
      primary: {
        source,
        ticker: hedge.stock.ticker,
        action: hedge.stock.action === "NO_TRADE" ? "BUY" : hedge.stock.action,
        entry: hedge.stock.entry,
        stop_loss: hedge.stock.stop_loss,
        take_profit: hedge.stock.take_profit,
        qty: 100,
        timestamp: Date.now(),
      },
      hedge: {
        source,
        ticker: hedge.option.ticker,
        strategy: hedge.option.strategy,
        bias: hedge.option.bias,
        expiry: hedge.option.expiry,
        legs: [{ action: "buy", instrument: hedge.option.bias === "bearish" ? "put" : "call", strike: hedge.option.long_strike ?? 0, qty: 1 }],
        timestamp: Date.now(),
      },
      thesis: `${hedge.stock.reason} | Hedge: ${hedge.option.reason}`,
      timestamp: Date.now(),
    })
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Stock Leg */}
      <div className="rounded-md border border-border/50 p-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Stock Leg</div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold">{hedge.stock.ticker}</span>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-green-400">
            {hedge.stock.action}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{hedge.stock.reason}</p>
      </div>

      {/* Hedge Option Leg */}
      <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-2">
        <div className="mb-1 flex items-center gap-1">
          <Shield className="h-3 w-3 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">Protective Hedge</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold">{hedge.option.ticker}</span>
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
            {hedge.option.strategy}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <Stat label="Strike" value={`$${hedge.option.long_strike?.toFixed(2)}`} />
          <Stat label="POP" value={`${hedge.option.probability_of_profit}%`} />
        </div>
      </div>

      <button
        onClick={handleStageHedge}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
      >
        <Shield className="h-3 w-3" />
        Stage Hedged Position
      </button>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-xs font-semibold", color)}>{value}</p>
    </div>
  )
}
