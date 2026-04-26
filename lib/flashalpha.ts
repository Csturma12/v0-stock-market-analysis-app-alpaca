/**
 * FlashAlpha API Client
 * https://flashalpha.com — Institutional-grade options analytics
 * GEX, DEX, VEX, IV Rank, Vol Surface, and more
 */

const BASE = "https://api.flashalpha.com/v1"
const FA_KEY = process.env.FLASHALPHA_API_KEY ?? ""

async function faFetch<T>(path: string): Promise<T | null> {
  if (!FA_KEY) {
    console.warn("[FlashAlpha] FLASHALPHA_API_KEY not configured")
    return null
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        "x-api-key": FA_KEY,
        Accept: "application/json",
      },
      next: { revalidate: 60 },
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

export async function getGEX(symbol: string): Promise<FAGreekExposure | null> {
  const sym = symbol.toUpperCase()
  const res = await faFetch<{ data: FAGreekExposure }>(`/gex/${sym}`)
  return res?.data ?? null
}

export async function getIVMetrics(symbol: string): Promise<FAIVMetrics | null> {
  const sym = symbol.toUpperCase()
  const res = await faFetch<{ data: FAIVMetrics }>(`/iv/${sym}`)
  return res?.data ?? null
}

export async function getVolSurface(symbol: string): Promise<FAVolSurface | null> {
  const sym = symbol.toUpperCase()
  const res = await faFetch<{ data: FAVolSurface }>(`/surface/${sym}`)
  return res?.data ?? null
}

export async function getFlowSummary(symbol: string): Promise<FAFlowSummary | null> {
  const sym = symbol.toUpperCase()
  const res = await faFetch<{ data: FAFlowSummary }>(`/flow/${sym}`)
  return res?.data ?? null
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
