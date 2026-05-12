/**
 * Webull Trading API client
 * Uses HMAC-SHA1 signature authentication as required by Webull API
 * Docs: https://developer.webull.com/apis/docs/authentication/signature
 */

import crypto from "crypto"

// Environment: UAT (test) or Production
const IS_UAT = process.env.WEBULL_ENV !== "production"

// Different hosts for different endpoints
const AUTH_URL = IS_UAT
  ? "https://us-oauth-open-api.uat.webullbroker.com"
  : "https://us-oauth-open-api.webullbroker.com"

const TRADE_URL = IS_UAT
  ? "https://us-openapi-alb.uat.webullbroker.com"
  : "https://us-openapi.webullbroker.com"

// Default to trade URL for most operations
const BASE_URL = TRADE_URL

const APP_KEY = process.env.WEBULL_APP_KEY ?? ""
const APP_SECRET = process.env.WEBULL_APP_SECRET ?? ""

// Cached access token (with expiry tracking)
let cachedToken: { token: string; expires_at: number } | null = null

// ─────────────────────────────────────────────────────────────────────────────
// Signature Generation (HMAC-SHA1)
// ─────────────────────────────────────────────────────────────────────────────

function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, "")
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

/**
 * Build the signature string per Webull docs:
 * METHOD|PATH|TIMESTAMP|NONCE|BODY
 */
function buildSignatureString(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  body: string = ""
): string {
  return `${method}|${path}|${timestamp}|${nonce}|${body}`
}

/**
 * Compute HMAC-SHA1 signature
 */
function computeSignature(signatureString: string): string {
  return crypto
    .createHmac("sha1", APP_SECRET)
    .update(signatureString)
    .digest("base64")
}

/**
 * Build required headers for Webull API
 * Per docs, use x-app-secret directly (not signature-based auth)
 */
function buildHeaders(
  method: string,
  path: string,
  body: string = "",
  accessToken?: string
): Record<string, string> {
  const timestamp = getTimestamp()
  const nonce = generateNonce()
  const signatureString = buildSignatureString(method, path, timestamp, nonce, body)
  const signature = computeSignature(signatureString)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-app-key": APP_KEY,
    "x-app-secret": APP_SECRET, // Some endpoints use direct secret
    "x-timestamp": timestamp,
    "x-signature": signature,
    "x-signature-algorithm": "HMAC-SHA1",
    "x-signature-version": "1.0",
    "x-signature-nonce": nonce,
    "x-version": "v2",
  }

  if (accessToken) {
    headers["x-access-token"] = accessToken
  }

  return headers
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create access token using signed request
 * POST /openapi/auth/token/create
 */
async function createAccessToken(): Promise<string> {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error("WEBULL_APP_KEY and WEBULL_APP_SECRET must be set")
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.token
  }

  console.log("[v0] Webull: Creating new access token...")
  console.log("[v0] Webull AUTH_URL:", AUTH_URL)
  console.log("[v0] Webull APP_KEY length:", APP_KEY.length)

  // Use the server-to-server token creation endpoint
  const path = "/openapi/auth/token/create"
  const body = JSON.stringify({})
  const headers = buildHeaders("POST", path, body)

  const res = await fetch(`${AUTH_URL}${path}`, {
    method: "POST",
    headers,
    body,
  })

  const responseText = await res.text()
  console.log("[v0] Webull token response:", res.status, responseText.slice(0, 300))

  if (!res.ok) {
    throw new Error(`Webull token creation failed: ${res.status} ${responseText.slice(0, 200)}`)
  }

  const data = JSON.parse(responseText)
  
  // Handle Webull's response format: { data: { token, expires, status } }
  const token = data.data?.token ?? data.token
  const expires = data.data?.expires ?? data.expires ?? 3600

  if (!token) {
    throw new Error(`Webull token creation failed: no token in response - ${responseText.slice(0, 200)}`)
  }

  // Token status may be "PENDING" if 2FA is required
  const status = data.data?.status ?? data.status
  if (status === "PENDING") {
    console.log("[v0] Webull token status: PENDING - requires SMS verification in Webull App")
  }

  // Cache the token (expires is in seconds)
  const expiresIn = typeof expires === "number" ? expires : 15 * 24 * 3600 // default 15 days
  cachedToken = {
    token,
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
 * Check if we can authenticate
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

  const fullPath = `${path}${queryString}`
  const bodyString = body ? JSON.stringify(body) : ""
  const headers = buildHeaders(method, fullPath, bodyString, accessToken)

  const url = `${BASE_URL}${fullPath}`
  console.log(`[v0] Webull request: ${method} ${url}`)

  const res = await fetch(url, {
    method,
    headers,
    body: bodyString || undefined,
    cache: "no-store",
  })

  const responseText = await res.text()
  
  if (res.status === 401) {
    // Token invalid/expired, clear cache and retry once
    cachedToken = null
    console.log("[v0] Webull: Token expired, refreshing...")
    
    const newToken = await createAccessToken()
    const retryHeaders = buildHeaders(method, fullPath, bodyString, newToken)
    
    const retryRes = await fetch(url, {
      method,
      headers: retryHeaders,
      body: bodyString || undefined,
      cache: "no-store",
    })

    const retryText = await retryRes.text()
    if (!retryRes.ok) {
      throw new Error(`Webull ${retryRes.status}: ${retryText.slice(0, 300)}`)
    }

    return JSON.parse(retryText) as T
  }

  if (!res.ok) {
    console.error(`[Webull] ${method} ${path} ${res.status}: ${responseText.slice(0, 300)}`)
    throw new Error(`Webull ${res.status}: ${responseText.slice(0, 300)}`)
  }

  console.log(`[v0] Webull response:`, responseText.slice(0, 300))
  return JSON.parse(responseText) as T
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
// Stock Data APIs
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
