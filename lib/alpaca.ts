// Alpaca paper trading client. Hardcoded to paper endpoint so we can never hit live by mistake.
const BASE = "https://paper-api.alpaca.markets"

function headers() {
  // Accept either naming convention
  const id = process.env.ALPACA_API_KEY_ID ?? process.env.ALPACA_API_KEY
  const secret = process.env.ALPACA_API_SECRET_KEY ?? process.env.ALPACA_SECRET_API_KEY
  if (!id || !secret) throw new Error("ALPACA credentials are not set")
  return {
    "APCA-API-KEY-ID": id,
    "APCA-API-SECRET-KEY": secret,
    "Content-Type": "application/json",
  }
}

async function alpaca<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Alpaca ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export type AlpacaAccount = {
  id: string
  status: string
  currency: string
  cash: string
  portfolio_value: string
  buying_power: string
  equity: string
  last_equity: string
  pattern_day_trader: boolean
  trading_blocked: boolean
  account_blocked: boolean
}

export async function getAccount() {
  return alpaca<AlpacaAccount>("/v2/account")
}

export type AlpacaPosition = {
  symbol: string
  qty: string
  avg_entry_price: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
  current_price: string
  cost_basis: string
  side: "long" | "short"
}

export async function getPositions() {
  return alpaca<AlpacaPosition[]>("/v2/positions")
}

export type AlpacaOrder = {
  id: string
  symbol: string
  qty: string
  side: "buy" | "sell"
  type: string
  status: string
  filled_avg_price: string | null
  filled_qty: string
  submitted_at: string
  created_at: string
}

export async function getOrders(status: "open" | "closed" | "all" = "all", limit = 50) {
  return alpaca<AlpacaOrder[]>(`/v2/orders?status=${status}&limit=${limit}&direction=desc`)
}

export async function placeOrder(params: {
  symbol: string
  qty?: number
  notional?: number
  side: "buy" | "sell"
  type?: "market" | "limit"
  time_in_force?: "day" | "gtc"
  limit_price?: number
}) {
  return alpaca<AlpacaOrder>("/v2/orders", {
    method: "POST",
    body: JSON.stringify({
      symbol: params.symbol,
      ...(params.qty ? { qty: params.qty } : {}),
      ...(params.notional ? { notional: params.notional } : {}),
      side: params.side,
      type: params.type ?? "market",
      time_in_force: params.time_in_force ?? "day",
      ...(params.limit_price ? { limit_price: params.limit_price } : {}),
    }),
  })
}

export async function cancelOrder(id: string) {
  const res = await fetch(`${BASE}/v2/orders/${id}`, { method: "DELETE", headers: headers(), cache: "no-store" })
  return res.ok
}

export async function getClock() {
  return alpaca<{ is_open: boolean; next_open: string; next_close: string; timestamp: string }>("/v2/clock")
}
