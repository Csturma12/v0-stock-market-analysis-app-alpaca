// Polygon.io options endpoints. Contract reference data + per-contract snapshots.
// Free tier: contract reference lists work. Per-contract IV/greeks may require a paid plan.

const BASE = "https://api.polygon.io"

function key() {
  const k = process.env.POLYGON_API_KEY
  if (!k) throw new Error("POLYGON_API_KEY is not set")
  return k
}

async function polyOpt<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  url.searchParams.set("apiKey", key())
  const res = await fetch(url.toString(), { next: { revalidate: 120 } })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Polygon options ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export type OptionContract = {
  contractTicker: string // e.g. O:AAPL250117C00150000
  underlying: string
  type: "call" | "put"
  strike: number
  expiry: string // YYYY-MM-DD
  sharesPerContract: number
}

export type OptionChainSnapshot = OptionContract & {
  last?: number | null
  bid?: number | null
  ask?: number | null
  mid?: number | null
  volume?: number | null
  openInterest?: number | null
  iv?: number | null // implied vol (decimal, e.g. 0.32 = 32%)
  delta?: number | null
  gamma?: number | null
  theta?: number | null
  vega?: number | null
}

// List option contracts for an underlying. Polygon pages results; we fetch enough to cover
// the nearest 3-4 expiries at ~20 strikes each.
export async function listOptionContracts(
  symbol: string,
  opts: {
    expirationDateGte?: string // YYYY-MM-DD
    expirationDateLte?: string
    limit?: number
  } = {},
): Promise<OptionContract[]> {
  try {
    const data = await polyOpt<{ results?: any[] }>(`/v3/reference/options/contracts`, {
      underlying_ticker: symbol,
      limit: opts.limit ?? 250,
      order: "asc",
      sort: "expiration_date",
      "expiration_date.gte":
        opts.expirationDateGte ?? new Date().toISOString().slice(0, 10),
      ...(opts.expirationDateLte ? { "expiration_date.lte": opts.expirationDateLte } : {}),
    })
    return (
      data.results?.map((r) => ({
        contractTicker: r.ticker,
        underlying: r.underlying_ticker,
        type: (r.contract_type as "call" | "put") ?? "call",
        strike: r.strike_price,
        expiry: r.expiration_date,
        sharesPerContract: r.shares_per_contract ?? 100,
      })) ?? []
    )
  } catch (e) {
    console.error("[v0] listOptionContracts failed:", (e as Error).message)
    return []
  }
}

// Snapshot for a full chain (paid tier endpoint, may fail on free).
export async function getOptionChainSnapshot(symbol: string): Promise<OptionChainSnapshot[]> {
  try {
    const data = await polyOpt<{ results?: any[] }>(`/v3/snapshot/options/${symbol}`, { limit: 250 })
    return (
      data.results?.map((r) => {
        const details = r.details ?? {}
        const greeks = r.greeks ?? {}
        const quote = r.last_quote ?? {}
        const trade = r.last_trade ?? {}
        const bid = quote.bid ?? null
        const ask = quote.ask ?? null
        const mid = bid != null && ask != null ? (bid + ask) / 2 : null
        return {
          contractTicker: details.ticker ?? "",
          underlying: symbol,
          type: (details.contract_type as "call" | "put") ?? "call",
          strike: details.strike_price ?? 0,
          expiry: details.expiration_date ?? "",
          sharesPerContract: details.shares_per_contract ?? 100,
          last: trade.price ?? null,
          bid,
          ask,
          mid,
          volume: r.day?.volume ?? null,
          openInterest: r.open_interest ?? null,
          iv: r.implied_volatility ?? null,
          delta: greeks.delta ?? null,
          gamma: greeks.gamma ?? null,
          theta: greeks.theta ?? null,
          vega: greeks.vega ?? null,
        } as OptionChainSnapshot
      }) ?? []
    )
  } catch (e) {
    console.error("[v0] getOptionChainSnapshot failed:", (e as Error).message)
    return []
  }
}

// Summarize a chain for LLM consumption: pick ATM +/- 5 strikes per expiry, compact strings.
export function summarizeChainForLLM(
  chain: OptionChainSnapshot[],
  spot: number,
  maxExpiries = 3,
): string {
  if (chain.length === 0) return "(no options chain data — could be free-tier limit)"

  // Group by expiry
  const byExpiry = new Map<string, OptionChainSnapshot[]>()
  for (const c of chain) {
    if (!byExpiry.has(c.expiry)) byExpiry.set(c.expiry, [])
    byExpiry.get(c.expiry)!.push(c)
  }

  const sortedExpiries = [...byExpiry.keys()].sort().slice(0, maxExpiries)
  const lines: string[] = []

  for (const expiry of sortedExpiries) {
    const contracts = byExpiry.get(expiry) ?? []
    const calls = contracts.filter((c) => c.type === "call").sort((a, b) => a.strike - b.strike)
    const puts = contracts.filter((c) => c.type === "put").sort((a, b) => a.strike - b.strike)

    // Find ATM strike
    const uniqueStrikes = [...new Set(calls.map((c) => c.strike))]
    const atmStrike = uniqueStrikes.reduce(
      (best, k) => (Math.abs(k - spot) < Math.abs(best - spot) ? k : best),
      uniqueStrikes[0] ?? spot,
    )
    const atmIdx = uniqueStrikes.indexOf(atmStrike)
    const windowStrikes = uniqueStrikes.slice(Math.max(0, atmIdx - 4), atmIdx + 5)

    const dte = Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000))
    lines.push(`\nEXPIRY ${expiry} (${dte}d to expiration):`)

    for (const strike of windowStrikes) {
      const call = calls.find((c) => c.strike === strike)
      const put = puts.find((c) => c.strike === strike)
      const marker = Math.abs(strike - spot) < 0.5 ? " *ATM*" : ""
      const callPart = call
        ? `C mid=${call.mid?.toFixed(2) ?? "—"} IV=${call.iv ? (call.iv * 100).toFixed(0) + "%" : "—"} Δ=${call.delta?.toFixed(2) ?? "—"} OI=${call.openInterest ?? "—"} V=${call.volume ?? 0}`
        : "C —"
      const putPart = put
        ? `P mid=${put.mid?.toFixed(2) ?? "—"} IV=${put.iv ? (put.iv * 100).toFixed(0) + "%" : "—"} Δ=${put.delta?.toFixed(2) ?? "—"} OI=${put.openInterest ?? "—"} V=${put.volume ?? 0}`
        : "P —"
      lines.push(`  $${strike}${marker} | ${callPart} | ${putPart}`)
    }
  }

  return lines.join("\n")
}

// Compute a rough IV Rank from daily close returns when chain IV isn't available.
// Returns annualized realized vol as a decimal.
export function realizedVol(closes: number[]): number {
  if (closes.length < 10) return 0
  const rets: number[] = []
  for (let i = 1; i < closes.length; i++) {
    rets.push(Math.log(closes[i] / closes[i - 1]))
  }
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(1, rets.length - 1)
  return Math.sqrt(variance) * Math.sqrt(252)
}
