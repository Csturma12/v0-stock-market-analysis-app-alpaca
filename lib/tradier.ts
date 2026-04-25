/**
 * Tradier Brokerage API Client
 * https://documentation.tradier.com/brokerage-api
 */

const TRADIER_API_KEY = process.env.TRADIER_API_KEY ?? ""
const TRADIER_ACCOUNT_ID = process.env.TRADIER_ACCOUNT_ID ?? ""

// Use sandbox for testing, production for live
const BASE_URL = process.env.TRADIER_SANDBOX === "true"
  ? "https://sandbox.tradier.com/v1"
  : "https://api.tradier.com/v1"

const MARKET_URL = process.env.TRADIER_SANDBOX === "true"
  ? "https://sandbox.tradier.com/v1"
  : "https://api.tradier.com/v1"

async function tradierFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  if (!TRADIER_API_KEY) {
    console.warn("[Tradier] API key not configured")
    return null
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${TRADIER_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        ...options.headers,
      },
    })

    if (!res.ok) {
      console.error(`[Tradier] ${res.status} ${res.statusText} for ${endpoint}`)
      return null
    }

    return res.json()
  } catch (err) {
    console.error("[Tradier] Fetch error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Account
// ─────────────────────────────────────────────────────────────────────────────

export type TradierProfile = {
  id: string
  name: string
  account: {
    account_number: string
    classification: string
    day_trader: boolean
    status: string
    type: string
  }[]
}

export type TradierBalance = {
  account_number: string
  account_type: string
  cash: {
    cash_available: number
    sweep: number
    unsettled_funds: number
  }
  equity: number
  market_value: number
  buying_power: number
  pending_orders_count: number
}

export type TradierPosition = {
  id: number
  symbol: string
  quantity: number
  cost_basis: number
  date_acquired: string
}

export async function getProfile(): Promise<TradierProfile | null> {
  const res = await tradierFetch<{ profile: TradierProfile }>("/user/profile")
  return res?.profile ?? null
}

export async function getBalances(): Promise<TradierBalance | null> {
  const res = await tradierFetch<{ balances: TradierBalance }>(
    `/accounts/${TRADIER_ACCOUNT_ID}/balances`
  )
  return res?.balances ?? null
}

export async function getPositions(): Promise<TradierPosition[]> {
  const res = await tradierFetch<{ positions: { position: TradierPosition[] } | "null" }>(
    `/accounts/${TRADIER_ACCOUNT_ID}/positions`
  )
  if (!res || res.positions === "null") return []
  return Array.isArray(res.positions.position) ? res.positions.position : [res.positions.position]
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Data
// ─────────────────────────────────────────────────────────────────────────────

export type TradierQuote = {
  symbol: string
  description: string
  exch: string
  type: string
  last: number
  change: number
  change_percentage: number
  volume: number
  average_volume: number
  last_volume: number
  trade_date: number
  open: number
  high: number
  low: number
  close: number
  prevclose: number
  week_52_high: number
  week_52_low: number
  bid: number
  bidsize: number
  bidexch: string
  bid_date: number
  ask: number
  asksize: number
  askexch: string
  ask_date: number
}

export async function getQuotes(symbols: string[]): Promise<TradierQuote[]> {
  if (symbols.length === 0) return []
  const res = await tradierFetch<{ quotes: { quote: TradierQuote | TradierQuote[] } }>(
    `/markets/quotes?symbols=${symbols.join(",")}`
  )
  if (!res?.quotes?.quote) return []
  return Array.isArray(res.quotes.quote) ? res.quotes.quote : [res.quotes.quote]
}

export async function getQuote(symbol: string): Promise<TradierQuote | null> {
  const quotes = await getQuotes([symbol])
  return quotes[0] ?? null
}

export type TradierOptionChain = {
  symbol: string
  description: string
  exch: string
  type: string
  last: number
  change: number
  volume: number
  open: number
  high: number
  low: number
  close: number
  bid: number
  ask: number
  underlying: string
  strike: number
  expiration_date: string
  expiration_type: string
  option_type: "call" | "put"
  open_interest: number
  greeks?: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
    phi: number
    mid_iv: number
  }
}

export async function getOptionChain(
  symbol: string,
  expiration: string,
  greeks = true
): Promise<TradierOptionChain[]> {
  const res = await tradierFetch<{ options: { option: TradierOptionChain[] } }>(
    `/markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=${greeks}`
  )
  return res?.options?.option ?? []
}

export async function getOptionExpirations(symbol: string): Promise<string[]> {
  const res = await tradierFetch<{ expirations: { date: string[] } }>(
    `/markets/options/expirations?symbol=${symbol}`
  )
  return res?.expirations?.date ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export type TradierOrder = {
  id: number
  type: string
  symbol: string
  side: "buy" | "sell" | "buy_to_open" | "buy_to_close" | "sell_to_open" | "sell_to_close"
  quantity: number
  status: string
  duration: string
  price?: number
  stop_price?: number
  avg_fill_price?: number
  exec_quantity?: number
  last_fill_price?: number
  last_fill_quantity?: number
  remaining_quantity?: number
  create_date: string
  transaction_date?: string
  class: "equity" | "option" | "multileg" | "combo"
}

export async function getOrders(): Promise<TradierOrder[]> {
  const res = await tradierFetch<{ orders: { order: TradierOrder[] } | "null" }>(
    `/accounts/${TRADIER_ACCOUNT_ID}/orders`
  )
  if (!res || res.orders === "null") return []
  return Array.isArray(res.orders.order) ? res.orders.order : [res.orders.order]
}

export type PlaceOrderParams = {
  symbol: string
  side: "buy" | "sell" | "buy_to_open" | "buy_to_close" | "sell_to_open" | "sell_to_close"
  quantity: number
  type: "market" | "limit" | "stop" | "stop_limit"
  duration: "day" | "gtc" | "pre" | "post"
  price?: number
  stop?: number
  class?: "equity" | "option"
  option_symbol?: string
}

export async function placeOrder(params: PlaceOrderParams): Promise<{ id: number; status: string } | null> {
  const body = new URLSearchParams()
  body.append("class", params.class ?? "equity")
  body.append("symbol", params.symbol)
  body.append("side", params.side)
  body.append("quantity", String(params.quantity))
  body.append("type", params.type)
  body.append("duration", params.duration)
  if (params.price) body.append("price", String(params.price))
  if (params.stop) body.append("stop", String(params.stop))
  if (params.option_symbol) body.append("option_symbol", params.option_symbol)

  const res = await tradierFetch<{ order: { id: number; status: string } }>(
    `/accounts/${TRADIER_ACCOUNT_ID}/orders`,
    { method: "POST", body: body.toString() }
  )
  return res?.order ?? null
}

export async function cancelOrder(orderId: number): Promise<boolean> {
  const res = await tradierFetch<{ order: { id: number; status: string } }>(
    `/accounts/${TRADIER_ACCOUNT_ID}/orders/${orderId}`,
    { method: "DELETE" }
  )
  return res?.order?.status === "canceled"
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

export type TradierHistoryItem = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getHistory(
  symbol: string,
  interval: "daily" | "weekly" | "monthly" = "daily",
  start?: string,
  end?: string
): Promise<TradierHistoryItem[]> {
  const params = new URLSearchParams({ symbol, interval })
  if (start) params.append("start", start)
  if (end) params.append("end", end)

  const res = await tradierFetch<{ history: { day: TradierHistoryItem[] } }>(
    `/markets/history?${params.toString()}`
  )
  return res?.history?.day ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return !!TRADIER_API_KEY && !!TRADIER_ACCOUNT_ID
}
