"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type StagedStockTrade = {
  source: "claude" | "openai"
  ticker: string
  action: "BUY" | "SELL"
  entry: number | null
  stop_loss: number | null
  take_profit: number | null
  qty: number
  thesis?: string
  timestamp: number
}

export type StagedOptionsTrade = {
  source: "claude" | "openai"
  ticker: string
  strategy: string
  bias: "bullish" | "bearish" | "neutral"
  expiry: string
  legs: {
    action: "buy" | "sell"
    instrument: "call" | "put"
    strike: number
    qty: number
    limitPrice?: number
  }[]
  thesis?: string
  timestamp: number
}

export type StagedHedgeTrade = {
  source: "claude" | "openai"
  ticker: string
  primary: StagedStockTrade | StagedOptionsTrade
  hedge: StagedOptionsTrade
  thesis?: string
  timestamp: number
}

type StagedTradeContextType = {
  stagedStock: StagedStockTrade | null
  stagedOptions: StagedOptionsTrade | null
  stagedHedge: StagedHedgeTrade | null
  stageStock: (trade: StagedStockTrade) => void
  stageOptions: (trade: StagedOptionsTrade) => void
  stageHedge: (trade: StagedHedgeTrade) => void
  clearStock: () => void
  clearOptions: () => void
  clearHedge: () => void
  clearAll: () => void
}

const StagedTradeContext = createContext<StagedTradeContextType | null>(null)

const STORAGE_KEY = "v0_staged_trades"

export function StagedTradeProvider({ children }: { children: ReactNode }) {
  const [stagedStock, setStagedStock] = useState<StagedStockTrade | null>(null)
  const [stagedOptions, setStagedOptions] = useState<StagedOptionsTrade | null>(null)
  const [stagedHedge, setStagedHedge] = useState<StagedHedgeTrade | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.stagedStock) setStagedStock(parsed.stagedStock)
        if (parsed.stagedOptions) setStagedOptions(parsed.stagedOptions)
        if (parsed.stagedHedge) setStagedHedge(parsed.stagedHedge)
      }
    } catch (e) {
      console.error("[v0] Failed to load staged trades:", e)
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stagedStock, stagedOptions, stagedHedge }))
    } catch (e) {
      console.error("[v0] Failed to save staged trades:", e)
    }
  }, [stagedStock, stagedOptions, stagedHedge])

  const stageStock = (trade: StagedStockTrade) => setStagedStock(trade)
  const stageOptions = (trade: StagedOptionsTrade) => setStagedOptions(trade)
  const stageHedge = (trade: StagedHedgeTrade) => setStagedHedge(trade)
  const clearStock = () => setStagedStock(null)
  const clearOptions = () => setStagedOptions(null)
  const clearHedge = () => setStagedHedge(null)
  const clearAll = () => {
    setStagedStock(null)
    setStagedOptions(null)
    setStagedHedge(null)
  }

  return (
    <StagedTradeContext.Provider
      value={{
        stagedStock,
        stagedOptions,
        stagedHedge,
        stageStock,
        stageOptions,
        stageHedge,
        clearStock,
        clearOptions,
        clearHedge,
        clearAll,
      }}
    >
      {children}
    </StagedTradeContext.Provider>
  )
}

export function useStagedTrades() {
  const ctx = useContext(StagedTradeContext)
  if (!ctx) {
    throw new Error("useStagedTrades must be used within StagedTradeProvider")
  }
  return ctx
}
