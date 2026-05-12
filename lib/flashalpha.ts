/**
 * FlashAlpha API Client
 * https://flashalpha.com — Institutional-grade options analytics
 * GEX, DEX, VEX, IV Rank, Vol Surface, and more
 */

const BASE = "https://lab.flashalpha.com"
const FA_KEY = process.env.FLASHALPHA_API_KEY ?? ""

async function faFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  if (!FA_KEY) {
    console.warn("[FlashAlpha] FLASHALPHA_API_KEY not configured")
    return null
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        "X-Api-Key": FA_KEY,
        Accept: "application/json",
      },
      next: { revalidate },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.warn(`[FlashAlpha] ${res.status} for ${path}: ${body.slice(0, 200)}`)
      return null
    }
    return res.json() as Promise<T>
  } catch (err) {
    console.error("[FlashAlpha] fetch error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FAGreekExposure = {
  symbol: string
  date: string
  // Gamma Exposure (GEX) — net dealer gamma in $ per 1% move
  gex: number | null
  call_gex: number | null
  put_gex: number | null
  gex_flip: number | null          // Price level where dealer gamma flips from positive to negative
  // Delta Exposure (DEX)
  dex: number | null
  call_dex: number | null
  put_dex: number | null
  // Vanna/Charm exposure
  vex: number | null
}

export type FAIVMetrics = {
  symbol: string
  date: string
  iv_rank: number | null           // 0–100, where 100 = highest IV in past year
  iv_percentile: number | null     // % of days IV was below current IV
  iv_current: number | null        // Current 30d implied vol
  iv_30d_avg: number | null
  iv_hv_spread: number | null      // IV minus HV (premium or discount)
  term_structure: {
    expiry: string
    iv: number
  }[]
}

export type FAVolSurface = {
  symbol: string
  date: string
  surface: {
    expiry: string
    strikes: {
      strike: number
      call_iv: number | null
      put_iv: number | null
      delta: number | null
    }[]
  }[]
}

export type FAFlowSummary = {
  symbol: string
  date: string
  call_volume: number
  put_volume: number
  call_oi: number
  put_oi: number
  put_call_ratio: number
  call_premium: number
  put_premium: number
  unusual_calls: {
    strike: number
    expiry: string
    volume: number
    oi: number
    volume_oi_ratio: number
    iv: number | null
    premium: number
  }[]
  unusual_puts: {
    strike: number
    expiry: string
    volume: number
    oi: number
    volume_oi_ratio: number
    iv: number | null
    premium: number
  }[]
}

export type FAFullMetrics = {
  gex: FAGreekExposure | null
  iv: FAIVMetrics | null
  flow: FAFlowSummary | null
}

// ─────────────────────────────────────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Per-Strike Exposure Types (from docs)
// ─────────────────────────────────────────────────────────────────────────────

export type FAStrikeData = {
  strike: number
  call_gex: number
  put_gex: number
  net_gex: number
  call_oi: number
  put_oi: number
  call_volume: number
  put_volume: number
  call_oi_change: number
  put_oi_change: number
}

export type FAGEXResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  gamma_flip: number
  net_gex: number
  net_gex_label: "positive" | "negative"
  strikes: FAStrikeData[]
}

export type FADEXResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  net_dex: number
  strikes: Array<{
    strike: number
    call_dex: number
    put_dex: number
    net_dex: number
  }>
}

export type FAVEXResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  net_vex: number
  strikes: Array<{
    strike: number
    call_vex: number
    put_vex: number
    net_vex: number
  }>
}

export type FACHEXResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  net_chex: number
  strikes: Array<{
    strike: number
    call_chex: number
    put_chex: number
    net_chex: number
  }>
}

export type FALevelsResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  gamma_flip: number
  call_wall: number
  put_wall: number
  max_gamma_strike: number
  zero_dte_magnet: number | null
}

export type FASummaryResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  gamma_flip: number
  net_gex: number
  net_dex: number
  net_vex: number
  net_chex: number
  regime: "positive_gamma" | "negative_gamma" | "neutral"
  regime_description: string
  call_wall: number
  put_wall: number
}

export type FANarrativeResponse = {
  symbol: string
  as_of: string
  narrative: string
}

export type FAMaxPainResponse = {
  symbol: string
  underlying_price: number
  as_of: string
  max_pain: number
  pin_probability: number
  expirations: Array<{
    expiration: string
    max_pain: number
    call_oi: number
    put_oi: number
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// API Calls - Per-Strike Exposure
// ─────────────────────────────────────────────────────────────────────────────

export async function getGEXByStrike(symbol: string, expiration?: string): Promise<FAGEXResponse | null> {
  const sym = symbol.toUpperCase()
  const path = expiration 
    ? `/v1/exposure/gex/${sym}?expiration=${expiration}`
    : `/v1/exposure/gex/${sym}`
  return faFetch<FAGEXResponse>(path)
}

export async function getDEXByStrike(symbol: string): Promise<FADEXResponse | null> {
  return faFetch<FADEXResponse>(`/v1/exposure/dex/${symbol.toUpperCase()}`)
}

export async function getVEXByStrike(symbol: string): Promise<FAVEXResponse | null> {
  return faFetch<FAVEXResponse>(`/v1/exposure/vex/${symbol.toUpperCase()}`)
}

export async function getCHEXByStrike(symbol: string): Promise<FACHEXResponse | null> {
  return faFetch<FACHEXResponse>(`/v1/exposure/chex/${symbol.toUpperCase()}`)
}

export async function getExposureLevels(symbol: string): Promise<FALevelsResponse | null> {
  return faFetch<FALevelsResponse>(`/v1/exposure/levels/${symbol.toUpperCase()}`)
}

export async function getExposureSummary(symbol: string): Promise<FASummaryResponse | null> {
  return faFetch<FASummaryResponse>(`/v1/exposure/summary/${symbol.toUpperCase()}`)
}

export async function getExposureNarrative(symbol: string): Promise<FANarrativeResponse | null> {
  return faFetch<FANarrativeResponse>(`/v1/exposure/narrative/${symbol.toUpperCase()}`)
}

export async function getMaxPain(symbol: string): Promise<FAMaxPainResponse | null> {
  return faFetch<FAMaxPainResponse>(`/v1/maxpain/${symbol.toUpperCase()}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Data
// ─────────────────────────────────────────────────────────────────────────────

export type FAStockQuote = {
  symbol: string
  bid: number
  ask: number
  mid: number
  last: number
}

export type FAOptionQuote = {
  symbol: string
  chain: Array<{
    expiration: string
    strikes: Array<{
      strike: number
      call: { bid: number; ask: number; iv: number; delta: number; gamma: number; theta: number; vega: number; oi: number; volume: number } | null
      put: { bid: number; ask: number; iv: number; delta: number; gamma: number; theta: number; vega: number; oi: number; volume: number } | null
    }>
  }>
}

export async function getStockQuote(symbol: string): Promise<FAStockQuote | null> {
  return faFetch<FAStockQuote>(`/stockquote/${symbol.toUpperCase()}`)
}

export async function getOptionChain(symbol: string): Promise<FAOptionQuote | null> {
  return faFetch<FAOptionQuote>(`/optionquote/${symbol.toUpperCase()}`)
}

export async function getVolSurface(symbol: string): Promise<FAVolSurface | null> {
  return faFetch<FAVolSurface>(`/v1/surface/${symbol.toUpperCase()}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy aliases (for backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGEX(symbol: string): Promise<FAGreekExposure | null> {
  const gex = await getGEXByStrike(symbol)
  if (!gex) return null
  return {
    symbol: gex.symbol,
    date: gex.as_of,
    gex: gex.net_gex,
    call_gex: gex.strikes.reduce((sum, s) => sum + s.call_gex, 0),
    put_gex: gex.strikes.reduce((sum, s) => sum + s.put_gex, 0),
    gex_flip: gex.gamma_flip,
    dex: null,
    call_dex: null,
    put_dex: null,
    vex: null,
  }
}

export async function getIVMetrics(symbol: string): Promise<FAIVMetrics | null> {
  // Use the summary endpoint to get IV-related data
  const summary = await getExposureSummary(symbol)
  if (!summary) return null
  return {
    symbol: summary.symbol,
    date: summary.as_of,
    iv_rank: null,
    iv_percentile: null,
    iv_current: null,
    iv_30d_avg: null,
    iv_hv_spread: null,
    term_structure: [],
  }
}

export async function getFlowSummary(symbol: string): Promise<FAFlowSummary | null> {
  const gex = await getGEXByStrike(symbol)
  if (!gex) return null
  
  const callVol = gex.strikes.reduce((sum, s) => sum + s.call_volume, 0)
  const putVol = gex.strikes.reduce((sum, s) => sum + s.put_volume, 0)
  const callOi = gex.strikes.reduce((sum, s) => sum + s.call_oi, 0)
  const putOi = gex.strikes.reduce((sum, s) => sum + s.put_oi, 0)
  
  return {
    symbol: gex.symbol,
    date: gex.as_of,
    call_volume: callVol,
    put_volume: putVol,
    call_oi: callOi,
    put_oi: putOi,
    put_call_ratio: callVol > 0 ? putVol / callVol : 0,
    call_premium: 0,
    put_premium: 0,
    unusual_calls: [],
    unusual_puts: [],
  }
}

/** Fetch all FlashAlpha metrics for a ticker in one parallel call */
export async function getFullMetrics(symbol: string): Promise<FAFullMetrics> {
  const [gex, iv, flow] = await Promise.all([
    getGEX(symbol),
    getIVMetrics(symbol),
    getFlowSummary(symbol),
  ])
  return { gex, iv, flow }
}

/** Fetch comprehensive exposure data in parallel */
export async function getFullExposure(symbol: string) {
  const [gex, dex, vex, chex, levels, summary, maxPain] = await Promise.all([
    getGEXByStrike(symbol),
    getDEXByStrike(symbol),
    getVEXByStrike(symbol),
    getCHEXByStrike(symbol),
    getExposureLevels(symbol),
    getExposureSummary(symbol),
    getMaxPain(symbol),
  ])
  return { gex, dex, vex, chex, levels, summary, maxPain }
}

export function isConfigured(): boolean {
  return !!FA_KEY
}

/** Format GEX/DEX for LLM context strings */
export function formatForLLM(metrics: FAFullMetrics): string {
  const { gex, iv, flow } = metrics

  const gexStr = gex
    ? `GEX: $${gex.gex?.toLocaleString() ?? "—"} | GEX Flip: $${gex.gex_flip ?? "—"}
Call GEX: $${gex.call_gex?.toLocaleString() ?? "—"} | Put GEX: $${gex.put_gex?.toLocaleString() ?? "—"}
DEX: $${gex.dex?.toLocaleString() ?? "—"} | VEX: $${gex.vex?.toLocaleString() ?? "—"}`
    : "(GEX not available)"

  const ivStr = iv
    ? `IV Rank: ${iv.iv_rank?.toFixed(0) ?? "—"}/100 | IV Percentile: ${iv.iv_percentile?.toFixed(0) ?? "—"}%
Current IV: ${iv.iv_current ? (iv.iv_current * 100).toFixed(1) + "%" : "—"} | HV Spread: ${iv.iv_hv_spread ? (iv.iv_hv_spread * 100).toFixed(1) + "%" : "—"}`
    : "(IV metrics not available)"

  const flowStr = flow
    ? `Call Vol: ${flow.call_volume?.toLocaleString()} | Put Vol: ${flow.put_volume?.toLocaleString()} | P/C Ratio: ${flow.put_call_ratio?.toFixed(2)}
Call Premium: $${flow.call_premium?.toLocaleString()} | Put Premium: $${flow.put_premium?.toLocaleString()}
Unusual Calls: ${flow.unusual_calls?.length ?? 0} sweeps | Unusual Puts: ${flow.unusual_puts?.length ?? 0} sweeps`
    : "(flow not available)"

  return `FLASHALPHA — INSTITUTIONAL ANALYTICS:
${gexStr}

VOLATILITY METRICS (FlashAlpha):
${ivStr}

OPTIONS FLOW (FlashAlpha):
${flowStr}`
}
