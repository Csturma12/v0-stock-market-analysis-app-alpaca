"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TradingAccount } from "@/components/trading-account"
import { TradingSettings } from "@/components/trading-settings"
import { TradingPositions } from "@/components/trading-positions"
import { TradingOrderForm } from "@/components/trading-order-form"
import { TradingTradeIdea } from "@/components/trading-trade-idea"
import { TradingDeck } from "@/components/trading-deck"
import { AutonomousWatchlist } from "@/components/autonomous-watchlist"
import { OptionsAnalyzer } from "@/components/options-analyzer"

type StageParams = {
  symbol?: string
  side?: "buy" | "sell"
  qty?: number
  type?: "limit" | "market"
  limitPrice?: number
  stop?: number
  target?: number
  thesis?: string
  isOption?: boolean
  optionType?: "call" | "put"
  optionStrike?: number
  optionExpiry?: string
  optionAction?: "buy" | "sell"
  optionQty?: number
  optionLimit?: number
}

export default function TradingPage() {
  const [stageParams, setStageParams] = useState<StageParams | null>(null)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Alpaca · Paper Trading
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Autonomous Trading Panel</h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Paper trading only until you flip the live switch. Guardrails apply to both manual and autonomous orders.
        </p>
      </header>

      {/* Account + Settings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradingAccount />
        </div>
        <div>
          <TradingSettings />
        </div>
      </div>

      {/* AI Trade Idea Generator — full width */}
      <div className="mt-8">
        <TradingTradeIdea onStageOrder={(p) => setStageParams(p)} />
      </div>

      {/* Positions + Order form */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradingPositions />
        </div>
        <div>
          <Suspense fallback={<div className="h-[500px] rounded-lg border border-border bg-card" />}>
            <TradingOrderForm stageParams={stageParams} />
          </Suspense>
        </div>
      </div>

      {/* Autonomous Pattern Watchlist */}
      <section className="mt-8">
        <AutonomousWatchlist />
      </section>

      {/* Trade Deck — History, P&L, Strategy Performance */}
      <section className="mt-8">
        <TradingDeck />
      </section>

      {/* Options Analyzer */}
      <section className="mt-8">
        <OptionsAnalyzer />
      </section>
    </main>
  )
}
