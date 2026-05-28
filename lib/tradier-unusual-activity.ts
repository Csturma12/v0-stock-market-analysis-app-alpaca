/**
 * Custom unusual activity detector built on top of Tradier data.
 * Computes volume spikes, OI changes, and delta-weighted flow
 * without relying on any paid unusual-activity provider.
 */

import {
  getQuote,
  getOptionChain,
  getOptionExpirations,
  getHistory,
  type TradierOptionChain,
  type TradierQuote,
} from "@/lib/tradier"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UnusualContract = {
  symbol: string
  option_type: "call" | "put"
  strike: number
  expiry: string
  volume: number
  open_interest: number
  vol_oi_ratio: number         // volume / OI — anything > 0.5 is notable, > 1.0 is very unusual
  bid: number
  ask: number
  mid: number
  iv: number | null
  delta: number | null
  premium_est: number          // volume * mid * 100 — estimated $ premium traded
  is_unusual: boolean
}

export type FlowSentiment = "bullish" | "bearish" | "neutral"

export type TradierFlowSummary = {
  symbol: string
  quote: TradierQuote | null
  // Aggregates
  call_volume: number
  put_volume: number
  call_oi: number
  put_oi: number
  put_call_vol_ratio: number
  put_call_oi_ratio: number
  call_premium_est: number
  put_premium_est: number
  // Delta-weighted sentiment
  dw_call_volume: number       // sum(volume * |delta|) for calls
  dw_put_volume: number        // sum(volume * |delta|) for puts
  sentiment: FlowSentiment
  sentiment_score: number      // -100 to +100 (negative = bearish, positive = bullish)
  // Unusual contracts sorted by vol/OI ratio descending
  unusual_calls: UnusualContract[]
  unusual_puts: UnusualContract[]
  // Volume vs historical average
  stock_avg_volume: number | null
  stock_current_volume: number | null
  stock_vol_ratio: number | null  // current / avg, > 2 = elevated
  // 20-day price momentum
  price_change_20d: number | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────────────────────────────────────

function midPrice(contract: TradierOptionChain): number {
  if (contract.bid && contract.ask) return (contract.bid + contract.ask) / 2
  if (contract.last) return contract.last
  return 0
}

function classifyUnusual(contract: TradierOptionChain): UnusualContract {
  const vol = contract.volume ?? 0
  const oi = contract.open_interest ?? 1
  const ratio = oi > 0 ? vol / oi : 0
  const mid = midPrice(contract)
  const premiumEst = vol * mid * 100

  return {
    symbol: contract.symbol,
    option_type: contract.option_type,
    strike: contract.strike,
    expiry: contract.expiration_date,
    volume: vol,
    open_interest: oi,
    vol_oi_ratio: Math.round(ratio * 100) / 100,
    bid: contract.bid ?? 0,
    ask: contract.ask ?? 0,
    mid,
    iv: contract.greeks?.mid_iv ?? null,
    delta: contract.greeks?.delta ?? null,
    premium_est: Math.round(premiumEst),
    is_unusual: ratio > 0.5 || vol > 1000,
  }
}

function computeSentiment(
  dwCall: number,
  dwPut: number
): { sentiment: FlowSentiment; score: number } {
  const total = dwCall + dwPut
  if (total === 0) return { sentiment: "neutral", score: 0 }

  const score = Math.round(((dwCall - dwPut) / total) * 100)

  let sentiment: FlowSentiment = "neutral"
  if (score >= 20) sentiment = "bullish"
  else if (score <= -20) sentiment = "bearish"

  return { sentiment, score }
}

/** Fetch up to two near-term expirations and build a flow summary */
export async function getTradierFlowSummary(symbol: string): Promise<TradierFlowSummary | null> {
  const sym = symbol.toUpperCase()

  // Fetch quote + expirations in parallel
  const [quote, expirations] = await Promise.all([
    getQuote(sym),
    getOptionExpirations(sym),
  ])

  if (!expirations || expirations.length === 0) {
    return {
      symbol: sym,
      quote,
      call_volume: 0,
      put_volume: 0,
      call_oi: 0,
      put_oi: 0,
      put_call_vol_ratio: 0,
      put_call_oi_ratio: 0,
      call_premium_est: 0,
      put_premium_est: 0,
      dw_call_volume: 0,
      dw_put_volume: 0,
      sentiment: "neutral",
      sentiment_score: 0,
      unusual_calls: [],
      unusual_puts: [],
      stock_avg_volume: quote?.average_volume ?? null,
      stock_current_volume: quote?.volume ?? null,
      stock_vol_ratio: quote?.average_volume ? (quote.volume ?? 0) / quote.average_volume : null,
      price_change_20d: null,
    }
  }

  // Take nearest 2 expirations for options flow (most activity is near-term)
  const nearExpirations = expirations.slice(0, 2)

  // Fetch chains + 20d history in parallel
  const [chains, history] = await Promise.all([
    Promise.all(nearExpirations.map((exp) => getOptionChain(sym, exp, true))),
    getHistory(
      sym,
      "daily",
      new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10)
    ),
  ])

  const allContracts = chains.flat()

  // Aggregate metrics
  let callVol = 0, putVol = 0, callOI = 0, putOI = 0
  let callPremium = 0, putPremium = 0
  let dwCall = 0, dwPut = 0
  const callContracts: UnusualContract[] = []
  const putContracts: UnusualContract[] = []

  for (const c of allContracts) {
    const vol = c.volume ?? 0
    const oi = c.open_interest ?? 0
    const mid = midPrice(c)
    const delta = Math.abs(c.greeks?.delta ?? 0.5)
    const premium = vol * mid * 100

    if (c.option_type === "call") {
      callVol += vol
      callOI += oi
      callPremium += premium
      dwCall += vol * delta
    } else {
      putVol += vol
      putOI += oi
      putPremium += premium
      dwPut += vol * delta
    }

    const classified = classifyUnusual(c)
    if (classified.is_unusual || classified.vol_oi_ratio > 0.3) {
      if (c.option_type === "call") callContracts.push(classified)
      else putContracts.push(classified)
    }
  }

  // Sort by estimated premium (highest $ first)
  callContracts.sort((a, b) => b.premium_est - a.premium_est)
  putContracts.sort((a, b) => b.premium_est - a.premium_est)

  const { sentiment, score } = computeSentiment(dwCall, dwPut)

  // Stock volume vs average
  const avgVol = quote?.average_volume ?? null
  const curVol = quote?.volume ?? null
  const volRatio = avgVol && curVol ? curVol / avgVol : null

  // 20d price change
  let change20d: number | null = null
  if (history.length >= 2) {
    const first = history[0].close
    const last = history[history.length - 1].close
    change20d = ((last - first) / first) * 100
  }

  return {
    symbol: sym,
    quote,
    call_volume: callVol,
    put_volume: putVol,
    call_oi: callOI,
    put_oi: putOI,
    put_call_vol_ratio: callVol > 0 ? putVol / callVol : 0,
    put_call_oi_ratio: callOI > 0 ? putOI / callOI : 0,
    call_premium_est: Math.round(callPremium),
    put_premium_est: Math.round(putPremium),
    dw_call_volume: Math.round(dwCall),
    dw_put_volume: Math.round(dwPut),
    sentiment,
    sentiment_score: score,
    unusual_calls: callContracts.slice(0, 10),
    unusual_puts: putContracts.slice(0, 10),
    stock_avg_volume: avgVol,
    stock_current_volume: curVol,
    stock_vol_ratio: volRatio ? Math.round(volRatio * 100) / 100 : null,
    price_change_20d: change20d ? Math.round(change20d * 100) / 100 : null,
  }
}

/** Format Tradier flow summary for LLM context */
export function formatTradierFlowForLLM(flow: TradierFlowSummary): string {
  return `TRADIER REAL-TIME OPTIONS FLOW (Custom Detector):
Sentiment: ${flow.sentiment.toUpperCase()} (score: ${flow.sentiment_score > 0 ? "+" : ""}${flow.sentiment_score})
Call Vol: ${flow.call_volume.toLocaleString()} | Put Vol: ${flow.put_volume.toLocaleString()} | P/C Ratio: ${flow.put_call_vol_ratio.toFixed(2)}
Est. Call Premium: $${flow.call_premium_est.toLocaleString()} | Est. Put Premium: $${flow.put_premium_est.toLocaleString()}
Delta-Weighted Call: ${flow.dw_call_volume.toLocaleString()} | Delta-Weighted Put: ${flow.dw_put_volume.toLocaleString()}
Stock Vol Ratio: ${flow.stock_vol_ratio ? `${flow.stock_vol_ratio}x avg` : "—"} | 20d Price Change: ${flow.price_change_20d != null ? `${flow.price_change_20d > 0 ? "+" : ""}${flow.price_change_20d}%` : "—"}

Top Unusual Calls: ${flow.unusual_calls.slice(0, 3).map((c) => `$${c.strike} ${c.expiry} vol:${c.volume.toLocaleString()} OI:${c.open_interest.toLocaleString()} (${c.vol_oi_ratio}x) ~$${(c.premium_est / 1000).toFixed(0)}K`).join(" | ") || "none"}
Top Unusual Puts: ${flow.unusual_puts.slice(0, 3).map((p) => `$${p.strike} ${p.expiry} vol:${p.volume.toLocaleString()} OI:${p.open_interest.toLocaleString()} (${p.vol_oi_ratio}x) ~$${(p.premium_est / 1000).toFixed(0)}K`).join(" | ") || "none"}`
}
