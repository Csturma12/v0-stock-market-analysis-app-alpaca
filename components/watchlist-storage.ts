"use client"

export type Watchlists = Record<string, string[]>

export const WATCHLIST_STORAGE_KEY = "dashboard:watchlists:v1"
export const HIDDEN_DISCOVERY_KEY = "dashboard:hidden-discovery-tickers:v1"
export const DEFAULT_WATCHLISTS: Watchlists = {
  Main: ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "AMD"],
  Swing: ["VST", "OXY", "CSTM", "NXE"],
  Options: ["SPY", "QQQ", "AAPL", "NVDA"],
}

export function cleanSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "")
}

export function readWatchlists(): Watchlists {
  if (typeof window === "undefined") return DEFAULT_WATCHLISTS
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (!raw) return DEFAULT_WATCHLISTS
    const parsed = JSON.parse(raw) as Watchlists
    return Object.keys(parsed).length ? parsed : DEFAULT_WATCHLISTS
  } catch {
    return DEFAULT_WATCHLISTS
  }
}

export function writeWatchlists(watchlists: Watchlists) {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlists))
  window.dispatchEvent(new CustomEvent("watchlists-updated", { detail: watchlists }))
}

export function addTickerToWatchlist(symbol: string, listName = "Main") {
  const sym = cleanSymbol(symbol)
  if (!sym) return
  const watchlists = readWatchlists()
  const current = watchlists[listName] ?? []
  watchlists[listName] = [...new Set([sym, ...current.map(cleanSymbol).filter(Boolean)])]
  writeWatchlists(watchlists)
}

export function removeTickerFromWatchlist(symbol: string, listName: string) {
  const sym = cleanSymbol(symbol)
  const watchlists = readWatchlists()
  watchlists[listName] = (watchlists[listName] ?? []).filter((s) => cleanSymbol(s) !== sym)
  writeWatchlists(watchlists)
}

export function readHiddenDiscoveryTickers() {
  if (typeof window === "undefined") return new Set<string>()
  try {
    return new Set<string>(JSON.parse(window.localStorage.getItem(HIDDEN_DISCOVERY_KEY) ?? "[]"))
  } catch {
    return new Set<string>()
  }
}

export function hideDiscoveryTicker(symbol: string) {
  const hidden = readHiddenDiscoveryTickers()
  hidden.add(cleanSymbol(symbol))
  window.localStorage.setItem(HIDDEN_DISCOVERY_KEY, JSON.stringify([...hidden]))
  window.dispatchEvent(new CustomEvent("discovery-hidden-updated", { detail: [...hidden] }))
}

export function showAllDiscoveryTickers() {
  window.localStorage.removeItem(HIDDEN_DISCOVERY_KEY)
  window.dispatchEvent(new CustomEvent("discovery-hidden-updated", { detail: [] }))
}
