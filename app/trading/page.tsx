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
    <main className="mx-auto max-w-7xl px-2 py-6 md:px-4 md:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="mb-6 flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Alpaca · Paper Trading
        </span>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Autonomous Trading Panel</h1>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          TOP HALF — Full width, compact data panels (scrollable container)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8 max-h-[50vh] space-y-4 overflow-y-auto rounded-lg border border-border/50 bg-card/30 p-4">
        {/* Paper Account — full width */}
        <TradingAccount />

        {/* Open Positions + Pending Orders — full width */}
        <TradingPositions />

        {/* Trade Deck — full width */}
        <TradingDeck />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM SECTION — 2/3 left column + 1/3 right column
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — 2/3 width: Watchlist, AI Trade Generator, Options Analyzer */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Pattern Watchlist */}
          <section>
            <AutonomousWatchlist />
          </section>

          {/* AI Trade Generator */}
          <section>
            <TradingTradeIdea onStageOrder={(p) => setStageParams(p)} />
          </section>

          {/* Options Analyzer */}
          <section>
            <OptionsAnalyzer />
          </section>
        </div>

        {/* RIGHT — 1/3 width: Trading functions as pill blocks */}
        <div className="flex flex-col gap-4 lg:self-start">
          {/* Guardrails Pill Block */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Guardrails
              </h3>
            </div>
            <div className="p-4">
              <TradingSettings />
            </div>
          </div>

          {/* Stock/ETF Order Pill Block */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Stock / ETF Order
              </h3>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="h-48 animate-pulse rounded bg-muted/20" />}>
                <TradingOrderForm stageParams={stageParams} formType="stock" />
              </Suspense>
            </div>
          </div>

          {/* Options Order Pill Block */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Options Order
              </h3>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="h-48 animate-pulse rounded bg-muted/20" />}>
                <TradingOrderForm stageParams={stageParams} formType="options" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
