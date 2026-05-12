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

// Broker API for account operations
const BROKER_URL = IS_UAT
  ? "https://us-broker-api.uat.webullbroker.com"
  : "https://us-broker-api.webullbroker.com"

// Default to trade URL for most operations
const BASE_URL = TRADE_URL

const APP_KEY = process.env.WEBULL_APP_KEY ?? ""
const APP_SECRET = process.env.WEBULL_APP_SECRET ?? ""

// Cached access token (with expiry tracking)
let cachedToken: { 
  token: string
  refresh_token?: string
  expires_at: number 
} | null = null

// ─────────────────────────────────────────────────────────────────────────────
// Signature Generation (HMAC-SHA1) - Per Webull Docs
// https://developer.webull.com/apis/docs/authentication/signature
// ─────────────────────────────────────────────────────────────────────────────

function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, "")
}

function getTimestamp(): string {
  // ISO 8601 format: YYYY-MM-DDThh:mm:ssZ (UTC only)
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

/**
 * Generate signature following Webull's 3-step algorithm:
 * Step 1: Build signature string = path&sortedParams[&MD5(body)]
 * Step 2: Construct signing key = app_secret&
 * Step 3: signature = base64(HMAC-SHA1(key, urlEncode(signatureString)))
 */
function generateSignature(
  path: string,
  queryParams: Record<string, string>,
  body: string,
  host: string,
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
    host: host,
  }

  // Step 1: Build Signature String
  // 1. Merge query params + signing headers
  const allParams: Record<string, string> = { ...queryParams, ...signingHeaders }

  // 2-3. Sort by key, join as key=value pairs
  const str1 = Object.keys(allParams)
    .sort()
    .map((k) => `${k}=${allParams[k]}`)
    .join("&")

  // 4. If body has actual content (not empty object), compute MD5 (uppercase hex)
  // Python: if body_params: (checks if dict is non-empty)
  let str3: string
  let bodyHasContent = false
  try {
    const parsed = body ? JSON.parse(body) : {}
    bodyHasContent = Object.keys(parsed).length > 0
  } catch {
    bodyHasContent = body.length > 2 // More than just "{}"
  }
  
  if (bodyHasContent) {
    // Use compact JSON format like Python: separators=(',', ':')
    const compactBody = JSON.stringify(JSON.parse(body))
    const str2 = crypto.createHash("md5").update(compactBody).digest("hex").toUpperCase()
    str3 = `${path}&${str1}&${str2}`
  } else {
    str3 = `${path}&${str1}`
  }

  // 5. URL-encode the string
  const encodedString = encodeURIComponent(str3)

  // Step 2: Construct the signing key (app_secret + "&")
  const signingKey = `${APP_SECRET}&`

  // Step 3: Generate the signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(encodedString)
    .digest("base64")

  // Debug logging
  console.log("[v0] Webull signature debug:")
  console.log("  path:", path)
  console.log("  host:", host)
  console.log("  timestamp:", timestamp)
  console.log("  str3 (pre-encode):", str3.slice(0, 200))
  console.log("  signature:", signature)

  return signature
}

/**
 * Build required headers for Webull API
 */
function buildHeaders(
  path: string,
  queryParams: Record<string, string> = {},
  body: string = "",
  host: string,
  accessToken?: string
): Record<string, string> {
  const timestamp = getTimestamp()
  const nonce = generateNonce()
  const signature = generateSignature(path, queryParams, body, host, timestamp, nonce)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    host: host,
    "x-app-key": APP_KEY,
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

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 300000) {
    // Verify token is still valid with check endpoint
    const isValid = await checkTokenValid(cachedToken.token)
    if (isValid) {
      return cachedToken.token
    }
    console.log("[v0] Webull: Cached token invalid, refreshing...")
  }

  // Try to refresh if we have a refresh token
  if (cachedToken?.refresh_token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return refreshed
  }

  console.log("[v0] Webull: Creating new access token...")
  console.log("[v0] Webull TRADE_URL:", TRADE_URL)
  console.log("[v0] Webull APP_KEY:", APP_KEY.slice(0, 8) + "...")
  console.log("[v0] Webull APP_SECRET length:", APP_SECRET.length)

  // Use the server-to-server token creation endpoint
  const path = "/openapi/auth/token/create"
  const host = new URL(TRADE_URL).host
  // No body for token creation (empty body_params in Python example)
  const headers = buildHeaders(path, {}, "", host)
  
  // Debug: log headers (without sensitive values)
  console.log("[v0] Webull headers:", {
    ...headers,
    "x-signature": headers["x-signature"]?.slice(0, 10) + "...",
  })

  const res = await fetch(`${TRADE_URL}${path}`, {
    method: "POST",
    headers,
    // No body
  })

  const responseText = await res.text()
  console.log("[v0] Webull token response:", res.status, responseText.slice(0, 300))

  if (!res.ok) {
    throw new Error(`Webull token creation failed: ${res.status} ${responseText.slice(0, 200)}`)
  }

  const data = JSON.parse(responseText)
  
  // Handle Webull's response format: { data: { token, refresh_token, expires, status } }
  const token = data.data?.token ?? data.token
  const refreshToken = data.data?.refresh_token ?? data.refresh_token
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
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
  }

  console.log("[v0] Webull token cached, expires in", Math.round(expiresIn / 3600), "hours")
  return token
}

/**
 * Check if token is still valid
 * POST /openapi/auth/token/check
 */
async function checkTokenValid(token: string): Promise<boolean> {
  const path = "/openapi/auth/token/check"
  const body = JSON.stringify({ token })
  const host = new URL(TRADE_URL).host
  const headers = buildHeaders(path, {}, body, host)

  try {
    const res = await fetch(`${TRADE_URL}${path}`, {
      method: "POST",
      headers,
      body,
    })

    if (!res.ok) return false

    const data = await res.json()
    // Check if token is valid (status could be "ACTIVE", "VALID", etc.)
    const status = data.data?.status ?? data.status
    const isValid = status === "ACTIVE" || status === "VALID" || data.data?.valid === true
    
    console.log("[v0] Webull token check:", status, "valid:", isValid)
    return isValid
  } catch (err) {
    console.error("[v0] Webull token check error:", err)
    return false
  }
}

/**
 * Refresh access token using refresh_token
 * POST /openapi/auth/token/refresh
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!cachedToken?.refresh_token) {
    console.log("[v0] Webull: No refresh token available, creating new token...")
    cachedToken = null
    return createAccessToken()
  }

  console.log("[v0] Webull: Refreshing access token...")

  const path = "/openapi/auth/token/refresh"
  const body = JSON.stringify({ refresh_token: cachedToken.refresh_token })
  const host = new URL(TRADE_URL).host
  const headers = buildHeaders(path, {}, body, host)

  try {
    const res = await fetch(`${TRADE_URL}${path}`, {
      method: "POST",
      headers,
      body,
    })

    if (!res.ok) {
      console.log("[v0] Webull: Refresh failed, creating new token...")
      cachedToken = null
      return createAccessToken()
    }

    const data = await res.json()
    const token = data.data?.token ?? data.token
    const refreshToken = data.data?.refresh_token ?? data.refresh_token
    const expires = data.data?.expires ?? data.expires ?? 3600

    if (!token) {
      cachedToken = null
      return createAccessToken()
    }

    const expiresIn = typeof expires === "number" ? expires : 15 * 24 * 3600
    cachedToken = {
      token,
      refresh_token: refreshToken ?? cachedToken.refresh_token,
      expires_at: Date.now() + expiresIn * 1000,
    }

    console.log("[v0] Webull token refreshed, expires in", Math.round(expiresIn / 3600), "hours")
    return token
  } catch (err) {
    console.error("[v0] Webull refresh error:", err)
    cachedToken = null
    return createAccessToken()
  }
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

  const bodyString = body ? JSON.stringify(body) : ""
  const host = new URL(BASE_URL).host
  const headers = buildHeaders(path, queryParams, bodyString, host, accessToken)

  const queryString = Object.keys(queryParams).length
    ? "?" + new URLSearchParams(queryParams).toString()
    : ""
  const fullPath = `${path}${queryString}`

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
    // Token invalid/expired, try refresh first
    console.log("[v0] Webull: Token expired, refreshing...")
    
    const newToken = await refreshAccessToken()
    const retryHeaders = buildHeaders(path, queryParams, bodyString, host, newToken)
    
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
// ───────────────────────────────────────────────────��─────────────────────────

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
// Market Data APIs
// ─────────────────────────────────────────────────────────────────────────────

export type WebullTick = {
  symbol: string
  price: number
  volume: number
  timestamp: string
  side?: "BUY" | "SELL"
}

export type WebullSnapshot = {
  symbol: string
  last_price: number
  open: number
  high: number
  low: number
  close: number
  prev_close: number
  volume: number
  change: number
  change_pct: number
  timestamp: string
}

export type WebullQuote = {
  symbol: string
  bid: number
  bid_size: number
  ask: number
  ask_size: number
  spread: number
  timestamp: string
}

export type WebullBar = {
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: string
}

/**
 * Get tick-by-tick transaction records
 * GET /openapi/market-data/stock/tick
 */
export async function getStockTicks(
  symbol: string,
  startTime?: string,
  endTime?: string
): Promise<WebullTick[]> {
  try {
    const params: Record<string, string> = { symbol }
    if (startTime) params.start_time = startTime
    if (endTime) params.end_time = endTime
    
    const data = await webullRequest<{ data?: { ticks?: WebullTick[] } }>(
      "GET",
      "/openapi/market-data/stock/tick",
      params
    )
    return data.data?.ticks ?? []
  } catch (err) {
    console.error("[Webull] getStockTicks error:", err)
    return []
  }
}

/**
 * Get real-time market snapshot
 * GET /openapi/market-data/stock/snapshot
 */
export async function getStockSnapshot(symbol: string): Promise<WebullSnapshot | null> {
  try {
    const data = await webullRequest<{ data?: WebullSnapshot }>(
      "GET",
      "/openapi/market-data/stock/snapshot",
      { symbol }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getStockSnapshot error:", err)
    return null
  }
}

/**
 * Get order book / quote data
 * GET /openapi/market-data/stock/quotes
 */
export async function getStockQuotes(symbol: string, depth = 5): Promise<WebullQuote | null> {
  try {
    const data = await webullRequest<{ data?: WebullQuote }>(
      "GET",
      "/openapi/market-data/stock/quotes",
      { symbol, depth: String(depth) }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getStockQuotes error:", err)
    return null
  }
}

/**
 * Get historical OHLCV bars (candlestick data)
 * GET /openapi/market-data/stock/bars
 * @param interval - M1, M5, M15, M30, H1, D, W, M
 */
export async function getStockBars(
  symbol: string,
  interval: "M1" | "M5" | "M15" | "M30" | "H1" | "D" | "W" | "M" = "D",
  limit = 100
): Promise<WebullBar[]> {
  try {
    const data = await webullRequest<{ data?: { bars?: WebullBar[] } }>(
      "GET",
      "/openapi/market-data/stock/bars",
      { symbol, interval, limit: String(limit) }
    )
    return data.data?.bars ?? []
  } catch (err) {
    console.error("[Webull] getStockBars error:", err)
    return []
  }
}

/**
 * Get historical bars for multiple symbols (batch)
 * GET /openapi/market-data/stock/bars/batch
 */
export async function getStockBarsBatch(
  symbols: string[],
  interval: "M1" | "M5" | "M15" | "M30" | "H1" | "D" | "W" | "M" = "D",
  limit = 100
): Promise<Record<string, WebullBar[]>> {
  try {
    const data = await webullRequest<{ data?: Record<string, { bars?: WebullBar[] }> }>(
      "GET",
      "/openapi/market-data/stock/bars/batch",
      { symbols: symbols.join(","), interval, limit: String(limit) }
    )
    
    const result: Record<string, WebullBar[]> = {}
    if (data.data) {
      for (const [sym, val] of Object.entries(data.data)) {
        result[sym] = val.bars ?? []
      }
    }
    return result
  } catch (err) {
    console.error("[Webull] getStockBarsBatch error:", err)
    return {}
  }
}

/**
 * Get order flow / footprint data
 * GET /openapi/market-data/stock/footprint
 */
export async function getStockFootprint(symbol: string): Promise<any> {
  try {
    const data = await webullRequest<{ data?: any }>(
      "GET",
      "/openapi/market-data/stock/footprint",
      { symbol }
    )
    return data.data ?? null
  } catch (err) {
    console.error("[Webull] getStockFootprint error:", err)
    return null
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
// ───────────────────────────────────────────────────────────────────────────��─

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
