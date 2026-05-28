"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type TradingMode = "paper" | "live"

type TradingContextType = {
  mode: TradingMode
  setMode: (mode: TradingMode) => void
  toggleMode: () => void
  isPaper: boolean
  isLive: boolean
  broker: "alpaca" | "webull"
}

const TradingContext = createContext<TradingContextType | null>(null)

export function TradingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TradingMode>("paper")

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "paper" ? "live" : "paper"))
  }, [])

  const value: TradingContextType = {
    mode,
    setMode,
    toggleMode,
    isPaper: mode === "paper",
    isLive: mode === "live",
    broker: mode === "paper" ? "alpaca" : "webull",
  }

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

export function useTradingMode() {
  const ctx = useContext(TradingContext)
  if (!ctx) {
    throw new Error("useTradingMode must be used within TradingProvider")
  }
  return ctx
}
