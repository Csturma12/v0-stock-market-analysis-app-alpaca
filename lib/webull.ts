/**
 * Webull Trading API client
 * Docs: https://developer.webull.com/api-doc/
 * 
 * Supports: Account info, positions, orders, trading
 */

import crypto from "crypto"

const APP_KEY = process.env.WEBULL_APP_KEY ?? ""
const APP_SECRET = process.env.WEBULL_APP_SECRET ?? ""
const HOST = "api.webull.com" // Production endpoint
const BASE_URL = `https://${HOST}`

// ─────────────────────────────────────────────────────────────────────────────
// Signature Generation (HMAC-SHA1)
// ─────────────────────────────────────────────────────────────────────────────

function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, "")
}

function generateTimestamp(): string {
  return new Date().toISOString().split(".")[0] + "Z"
}

function generateSignature(
  path: string,
  queryParams: Record<string, string>,
  bodyString: string,
  timestamp: string,
  nonce: string
): string {
  // Signing headers (x-signature and x-version are NOT included)
  const signingHeaders: Record<string, string> = {
    "x-app-key": APP_KEY,
    "x-timestamp": timestamp,
    "x-signature-algorithm": "HMAC-SHA1",
    "x-signature-version": "1.0",
    "x-signature-nonce": nonce,
    host: HOST,
  }

  // Step 1: Merge query params + signing headers
  const allParams = { ...queryParams, ...signingHeaders }

  // Sort by key, join as key=value pairs
  const str1 = Object.keys(allParams)
    .sort()
    .map((k) => `${k}=${allParams[k]}`)
    .join("&")

  // If body exists, compute MD5 (uppercase hex)
  let str3: string
  if (bodyString) {
    const str2 = crypto.createHash("md5").update(bodyString).digest("hex").toUpperCase()
    str3 = `${path}&${str1}&${str2}`
  } else {
    str3 = `${path}&${str1}`
  }

  // URL-encode
  const encodedString = encodeURIComponent(str3)

  // Step 2: Construct the key (app_secret + "&")
  const signingKey = `${APP_SECRET}&`

  // Step 3: Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(encodedString)
    .digest("base64")

  return signature
}

function buildHeaders(
  path: string,
  queryParams: Record<string, string> = {},
  bodyString = ""
): Record<string, string> {
  const timestamp = generateTimestamp()
  const nonce = generateNonce()
  const signature = generateSignature(path, queryParams, bodyString, timestamp, nonce)

  return {
    "x-app-key": APP_KEY,
    "x-timestamp": timestamp,
    "x-signature": signature,
    "x-signature-algorithm": "HMAC-SHA1",
    "x-signature-version": "1.0",
    "x-signature-nonce": nonce,
    "x-version": "v2",
    "Content-Type": "application/json",
  }
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
  // Check if credentials are configured
  if (!APP_KEY || !APP_SECRET) {
    console.error("[Webull] Missing WEBULL_APP_KEY or WEBULL_APP_SECRET")
    throw new Error("Webull credentials not configured")
  }

  const bodyString = body ? JSON.stringify(body) : ""
  const headers = buildHeaders(path, queryParams, bodyString)

  const queryString = Object.keys(queryParams).length
    ? "?" + new URLSearchParams(queryParams).toString()
    : ""

  const url = `${BASE_URL}${path}${queryString}`
  
  console.log(`[v0] Webull request: ${method} ${url}`)

  const res = await fetch(url, {
    method,
    headers,
    body: bodyString || undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    console.error(`[Webull] ${method} ${path} ${res.status}: ${errBody.slice(0, 300)}`)
    throw new Error(`Webull ${res.status}: ${errBody.slice(0, 300)}`)
  }

  const data = await res.json() as T
  console.log(`[v0] Webull response:`, JSON.stringify(data).slice(0, 200))
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
    "/openapi/account/v2/list"
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
      "/openapi/account/v2/balance",
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
  side: string // "LONG" | "SHORT"
  asset_type: string // "STOCK" | "OPTION" | "CRYPTO"
}

export async function getPositions(accountId: string): Promise<WebullPosition[]> {
  try {
    const data = await webullRequest<{ data?: { positions?: WebullPosition[] } }>(
      "GET",
      "/openapi/account/v2/positions",
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
      "/openapi/trade/v2/orders/open",
      { account_id: accountId }
    )
    return data.data?.orders ?? []
  } catch (err) {
    console.error("[Webull] getOpenOrders error:", err)
    return []
  }
}

export async function getOrderHistory(
  accountId: string,
  limit = 50
): Promise<WebullOrder[]> {
  try {
    const data = await webullRequest<{ data?: { orders?: WebullOrder[] } }>(
      "GET",
      "/openapi/trade/v2/orders/history",
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
      "/openapi/trade/v2/order/place",
      {},
      params
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] placeOrder error:", err)
    return null
  }
}

export async function cancelOrder(
  accountId: string,
  orderId: string
): Promise<boolean> {
  try {
    await webullRequest(
      "DELETE",
      "/openapi/trade/v2/order/cancel",
      { account_id: accountId, order_id: orderId }
    )
    return true
  } catch (err) {
    console.error("[Webull] cancelOrder error:", err)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Data APIs (if available)
// ─────────────────────────────────────────────────────────────────────────────

export type WebullQuote = {
  symbol: string
  last_price: number
  bid: number
  ask: number
  bid_size: number
  ask_size: number
  volume: number
  change: number
  change_pct: number
  high: number
  low: number
  open: number
  prev_close: number
}

export async function getQuote(symbol: string): Promise<WebullQuote | null> {
  try {
    const data = await webullRequest<WebullQuote>(
      "GET",
      "/openapi/market/quote",
      { symbol }
    )
    return data
  } catch {
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

// Get first available account summary (convenience)
export async function getPrimaryAccountSummary(): Promise<AccountSummary | null> {
  try {
    const accounts = await getAccounts()
    if (accounts.length === 0) return null
    return getAccountSummary(accounts[0].account_id)
  } catch {
    return null
  }
}
