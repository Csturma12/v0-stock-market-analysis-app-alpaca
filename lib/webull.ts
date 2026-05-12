/**
 * Webull Trading API client
 * Base URL: https://us-openapi-alb.uat.webullbroker.com (UAT)
 * Token endpoint: /openapi/auth/token/create
 */

// Environment: UAT (test) or Production
const IS_UAT = process.env.WEBULL_ENV !== "production"
const BASE_URL = IS_UAT
  ? "https://us-openapi-alb.uat.webullbroker.com"
  : "https://us-openapi.webullbroker.com"

const APP_KEY = process.env.WEBULL_APP_KEY ?? ""
const APP_SECRET = process.env.WEBULL_APP_SECRET ?? ""

// Cached access token (with expiry tracking)
let cachedToken: { access_token: string; expires_at: number } | null = null

// ─────────────────────────────────────────────────────────────────────────────
// Token Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create access token using app credentials
 * POST /openapi/auth/token/create
 */
async function createAccessToken(): Promise<string> {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error("WEBULL_APP_KEY and WEBULL_APP_SECRET must be set")
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token
  }

  console.log("[v0] Webull: Creating new access token...")

  const res = await fetch(`${BASE_URL}/openapi/auth/token/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_key: APP_KEY,
      app_secret: APP_SECRET,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    console.error("[Webull] Token creation failed:", res.status, err)
    throw new Error(`Webull token creation failed: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  console.log("[v0] Webull token response:", JSON.stringify(data).slice(0, 200))

  // Handle Webull's response format
  const token = data.data?.access_token ?? data.access_token
  const expiresIn = data.data?.expires_in ?? data.expires_in ?? 3600

  if (!token) {
    throw new Error(`Webull token creation failed: no access_token in response`)
  }

  // Cache the token
  cachedToken = {
    access_token: token,
    expires_at: Date.now() + expiresIn * 1000,
  }

  return token
}

/**
 * Check if credentials are configured
 */
export function isConfigured(): boolean {
  return !!(APP_KEY && APP_SECRET)
}

/**
 * Check if we can authenticate (alias for isConfigured since we use app credentials)
 */
export function isAuthenticated(): boolean {
  return isConfigured()
}

// ─────────────────────────────────────────────────────────────────────────────
// API Request Helper
// ─────────────────────────────────────────────────────────────────────────────

async function webullRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  queryParams: Record<string, string> = {},
  body?: object
): Promise<T> {
  if (!isConfigured()) {
    throw new Error("Webull credentials not configured - add WEBULL_APP_KEY and WEBULL_APP_SECRET")
  }

  const accessToken = await createAccessToken()

  const queryString = Object.keys(queryParams).length
    ? "?" + new URLSearchParams(queryParams).toString()
    : ""

  const url = `${BASE_URL}${path}${queryString}`
  console.log(`[v0] Webull request: ${method} ${url}`)

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (res.status === 401) {
    // Token invalid/expired, clear cache and retry once
    cachedToken = null
    const newToken = await createAccessToken()
    
    const retryRes = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    })

    if (!retryRes.ok) {
      const errBody = await retryRes.text().catch(() => "")
      throw new Error(`Webull ${retryRes.status}: ${errBody.slice(0, 300)}`)
    }

    return retryRes.json() as Promise<T>
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    console.error(`[Webull] ${method} ${path} ${res.status}: ${errBody.slice(0, 300)}`)
    throw new Error(`Webull ${res.status}: ${errBody.slice(0, 300)}`)
  }

  const data = await res.json() as T
  console.log(`[v0] Webull response:`, JSON.stringify(data).slice(0, 300))
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Account APIs
// ─────────────────────────────────────────────────────────────────────────────

export type WebullAccount = {
  account_id: string
  account_type: string
  currency: string
  status: string
}

export async function getAccounts(): Promise<WebullAccount[]> {
  const data = await webullRequest<{ data?: { account_list?: WebullAccount[] } }>(
    "GET",
    "/openapi/account/profile"
  )
  return data.data?.account_list ?? []
}

export type WebullBalance = {
  account_id: string
  currency: string
  total_cash: number
  total_market_value: number
  net_liquidation: number
  buying_power: number
  cash_balance: number
  settled_cash: number
  unsettled_cash: number
  day_trading_buying_power?: number
}

export async function getAccountBalance(accountId: string): Promise<WebullBalance | null> {
  try {
    const data = await webullRequest<{ data?: WebullBalance }>(
      "GET",
      "/openapi/account/balance",
      { account_id: accountId }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getAccountBalance error:", err)
    return null
  }
}

export type WebullPosition = {
  account_id: string
  instrument_id: string
  symbol: string
  qty: number
  market_value: number
  avg_cost: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  last_price: number
  side: string
  asset_type: string
}

export async function getPositions(accountId: string): Promise<WebullPosition[]> {
  try {
    const data = await webullRequest<{ data?: { positions?: WebullPosition[] } }>(
      "GET",
      "/openapi/account/positions",
      { account_id: accountId }
    )
    return data.data?.positions ?? []
  } catch (err) {
    console.error("[Webull] getPositions error:", err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Order APIs
// ─────────────────────────────────────────────────────────────────────────────

export type WebullOrder = {
  order_id: string
  account_id: string
  symbol: string
  side: "BUY" | "SELL"
  order_type: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
  time_in_force: "DAY" | "GTC" | "IOC" | "FOK"
  qty: number
  filled_qty: number
  limit_price?: number
  stop_price?: number
  avg_fill_price?: number
  status: string
  created_at: string
  updated_at: string
}

export async function getOpenOrders(accountId: string): Promise<WebullOrder[]> {
  try {
    const data = await webullRequest<{ data?: { orders?: WebullOrder[] } }>(
      "GET",
      "/openapi/trade/orders",
      { account_id: accountId, status: "PENDING" }
    )
    return data.data?.orders ?? []
  } catch (err) {
    console.error("[Webull] getOpenOrders error:", err)
    return []
  }
}

export async function getOrderHistory(accountId: string, limit = 50): Promise<WebullOrder[]> {
  try {
    const data = await webullRequest<{ data?: { orders?: WebullOrder[] } }>(
      "GET",
      "/openapi/trade/orders",
      { account_id: accountId, page_size: String(limit) }
    )
    return data.data?.orders ?? []
  } catch (err) {
    console.error("[Webull] getOrderHistory error:", err)
    return []
  }
}

export type PlaceOrderParams = {
  account_id: string
  symbol: string
  side: "BUY" | "SELL"
  order_type: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
  time_in_force: "DAY" | "GTC" | "IOC" | "FOK"
  qty: number
  limit_price?: number
  stop_price?: number
}

export async function placeOrder(params: PlaceOrderParams): Promise<WebullOrder | null> {
  try {
    const data = await webullRequest<{ data?: WebullOrder }>(
      "POST",
      "/openapi/trade/order/place",
      {},
      params
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] placeOrder error:", err)
    return null
  }
}

export async function cancelOrder(accountId: string, orderId: string): Promise<boolean> {
  try {
    await webullRequest(
      "POST",
      "/openapi/trade/order/cancel",
      {},
      { account_id: accountId, order_id: orderId }
    )
    return true
  } catch (err) {
    console.error("[Webull] cancelOrder error:", err)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock Data APIs (from your endpoint list)
// ─────────────────────────────────────────────────────────────────────────────

export type WebullSnapshot = {
  symbol: string
  last_price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  change_pct: number
  bid: number
  ask: number
  bid_size: number
  ask_size: number
}

export async function getSnapshot(symbol: string): Promise<WebullSnapshot | null> {
  try {
    const data = await webullRequest<{ data?: WebullSnapshot }>(
      "GET",
      "/openapi/market/snapshot",
      { symbol }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getSnapshot error:", err)
    return null
  }
}

export type WebullBar = {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getHistoricalBars(
  symbol: string,
  interval: "M1" | "M5" | "M15" | "M30" | "H1" | "D" = "D",
  limit = 100
): Promise<WebullBar[]> {
  try {
    const data = await webullRequest<{ data?: { bars?: WebullBar[] } }>(
      "GET",
      "/openapi/market/bars",
      { symbol, interval, limit: String(limit) }
    )
    return data.data?.bars ?? []
  } catch (err) {
    console.error("[Webull] getHistoricalBars error:", err)
    return []
  }
}

export type WebullQuote = {
  symbol: string
  bids: Array<{ price: number; qty: number; orders: number }>
  asks: Array<{ price: number; qty: number; orders: number }>
}

export async function getQuotes(symbol: string, depth = 5): Promise<WebullQuote | null> {
  try {
    const data = await webullRequest<{ data?: WebullQuote }>(
      "GET",
      "/openapi/market/quotes",
      { symbol, depth: String(depth) }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getQuotes error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: Get full account summary
// ─────────────────────────────────────────────────────────────────────────────

export type AccountSummary = {
  account: WebullAccount
  balance: WebullBalance | null
  positions: WebullPosition[]
  openOrders: WebullOrder[]
}

export async function getAccountSummary(accountId: string): Promise<AccountSummary | null> {
  try {
    const accounts = await getAccounts()
    const account = accounts.find((a) => a.account_id === accountId)
    if (!account) return null

    const [balance, positions, openOrders] = await Promise.all([
      getAccountBalance(accountId),
      getPositions(accountId),
      getOpenOrders(accountId),
    ])

    return { account, balance, positions, openOrders }
  } catch {
    return null
  }
}

export async function getPrimaryAccountSummary(): Promise<AccountSummary | null> {
  try {
    const accounts = await getAccounts()
    if (accounts.length === 0) return null
    return getAccountSummary(accounts[0].account_id)
  } catch {
    return null
  }
}
