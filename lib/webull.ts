/**
 * Webull Trading API client (OAuth2)
 * Docs: https://developer.webull.com/
 * 
 * Flow:
 * 1. User clicks "Connect Webull" -> redirected to Webull login
 * 2. After login, redirected back with authorization code
 * 3. Exchange code for access token
 * 4. Use access token for API calls
 */

// Environment: UAT (test) or Production
const IS_UAT = process.env.WEBULL_ENV === "uat" || !process.env.WEBULL_ENV
const OAUTH_HOST = IS_UAT
  ? "us-oauth-open-api.uat.webullbroker.com"
  : "us-oauth-open-api.webullbroker.com"
const API_HOST = IS_UAT
  ? "us-trade-open-api.uat.webullbroker.com"
  : "us-trade-open-api.webullbroker.com"

const CLIENT_ID = process.env.WEBULL_APP_KEY ?? ""
const CLIENT_SECRET = process.env.WEBULL_APP_SECRET ?? ""

// Stored access token (in production, store in database per user)
let accessToken: string | null = process.env.WEBULL_ACCESS_TOKEN ?? null
let refreshToken: string | null = process.env.WEBULL_REFRESH_TOKEN ?? null

// ─────────────────────────────────────────────────────────────────────────────
// OAuth2 Authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the OAuth2 authorization URL
 * Redirect user to this URL to start the login flow
 */
export function getAuthorizationUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: "user:trade:wr", // Read/write trading permissions
    redirect_uri: redirectUri,
    state: state ?? crypto.randomUUID(),
  })
  return `https://${OAUTH_HOST}/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 * Call this after user is redirected back with the code
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const res = await fetch(`https://${OAUTH_HOST}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[Webull] Token exchange failed:", res.status, err)
      return null
    }

    const data = await res.json()
    accessToken = data.access_token
    refreshToken = data.refresh_token
    return data
  } catch (err) {
    console.error("[Webull] Token exchange error:", err)
    return null
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false

  try {
    const res = await fetch(`https://${OAUTH_HOST}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
    })

    if (!res.ok) {
      console.error("[Webull] Token refresh failed:", res.status)
      return false
    }

    const data = await res.json()
    accessToken = data.access_token
    if (data.refresh_token) refreshToken = data.refresh_token
    return true
  } catch (err) {
    console.error("[Webull] Token refresh error:", err)
    return false
  }
}

/**
 * Set tokens manually (e.g., from database or env vars)
 */
export function setTokens(access: string, refresh?: string) {
  accessToken = access
  if (refresh) refreshToken = refresh
}

/**
 * Check if we have a valid access token
 */
export function isAuthenticated(): boolean {
  return !!accessToken
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
  if (!accessToken) {
    throw new Error("Webull not authenticated - user must complete OAuth login")
  }

  const queryString = Object.keys(queryParams).length
    ? "?" + new URLSearchParams(queryParams).toString()
    : ""

  const url = `https://${API_HOST}${path}${queryString}`

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
    // Token expired, try to refresh
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry the request
      return webullRequest(method, path, queryParams, body)
    }
    throw new Error("Webull authentication expired - please reconnect")
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    console.error(`[Webull] ${method} ${path} ${res.status}: ${errBody.slice(0, 300)}`)
    throw new Error(`Webull ${res.status}: ${errBody.slice(0, 300)}`)
  }

  return res.json() as Promise<T>
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
    "/api/trade/v2/account/list"
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
      "/api/trade/v2/account/balance",
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
      "/api/trade/v2/account/positions",
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
      "/api/trade/v2/order/list",
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
      "/api/trade/v2/order/list",
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
      "/api/trade/v2/order/place",
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
      "/api/trade/v2/order/cancel",
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
