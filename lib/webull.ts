import "server-only"

import crypto from "node:crypto"

type WebullMethod = "GET" | "POST"

const ACCOUNT_LIST_PATH = "/openapi/account/list"
const BALANCE_PATH = "/openapi/assets/balance"
const POSITIONS_PATH = "/openapi/assets/positions"

export type WebullAccount = {
  account_id: string
  account_number?: string
  account_type?: string
  account_label?: string
  account_class?: string
  user_id?: string
}

export type WebullBalance = {
  total_asset_currency?: string
  total_net_liquidation_value?: string | number
  total_market_value?: string | number
  total_cash_balance?: string | number
  total_unrealized_profit_loss?: string | number
  total_day_profit_loss?: string | number
  day_trades_left?: string | number
  maintenance_margin?: string | number
  open_margin_calls?: string | number
}

export type WebullPosition = {
  currency?: string
  quantity?: string | number
  cost?: string | number
  proportion?: string | number
  position_id?: string
  symbol?: string
  instrument_type?: string
  cost_price?: string | number
  last_price?: string | number
  market_value?: string | number
  unrealized_profit_loss?: string | number
  unrealized_profit_loss_rate?: string | number
  day_profit_loss?: string | number
  day_realized_profit_loss?: string | number
}

export type WebullOrder = {
  id?: string
  order_id?: string
  symbol?: string
  qty?: string | number
  side?: "BUY" | "SELL" | "buy" | "sell"
  order_type?: string
  status?: string
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

export type AccountSummary = {
  account: WebullAccount
  balance: WebullBalance | null
  positions: WebullPosition[]
  openOrders: WebullOrder[]
}

function hasEnv(name: string) {
  return Boolean(process.env[name])
}

function webullTokenExpiresAt() {
  const raw = process.env.WEBULL_TOKEN_EXPIRES
  if (!raw) return 0
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : 0
}

function hasUsableWebullToken() {
  const token = process.env.WEBULL_ACCESS_TOKEN
  if (!token) return false

  const expiresAt = webullTokenExpiresAt()
  return expiresAt === 0 || expiresAt > Date.now()
}

export function hasWebullConfig() {
  return hasEnv("WEBULL_APP_KEY") && hasEnv("WEBULL_APP_SECRET") && hasUsableWebullToken()
}

export function isConfigured() {
  return hasWebullConfig()
}

export function isAuthenticated() {
  return hasWebullConfig()
}

export function getTokenStatus() {
  const token = process.env.WEBULL_ACCESS_TOKEN
  if (!token) return null

  const expiresAt = webullTokenExpiresAt()
  return {
    status: expiresAt > 0 && expiresAt <= Date.now() ? "EXPIRED" : "NORMAL",
    expiresAt,
  }
}

export function getAuthorizationUrl(_redirectUri: string, _state: string) {
  throw new Error("Webull OAuth is not enabled. Use WEBULL_ACCESS_TOKEN from the verified token flow.")
}

export async function exchangeCodeForToken(_code: string, _redirectUri: string) {
  throw new Error("Webull OAuth is not enabled. Use WEBULL_ACCESS_TOKEN from the verified token flow.")
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function webullHost() {
  if (process.env.WEBULL_HOST) {
    return process.env.WEBULL_HOST.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }

  return process.env.WEBULL_ENVIRONMENT === "uat"
    ? "us-openapi-alb.uat.webullbroker.com"
    : "api.webull.com"
}

function timestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

function signRequest({
  path,
  query,
  body,
  host,
  appKey,
  appSecret,
  nonce,
  timestampValue,
}: {
  path: string
  query?: Record<string, string>
  body?: string
  host: string
  appKey: string
  appSecret: string
  nonce: string
  timestampValue: string
}) {
  const params: Record<string, string> = {
    host,
    "x-app-key": appKey,
    "x-signature-algorithm": "HMAC-SHA1",
    "x-signature-nonce": nonce,
    "x-signature-version": "1.0",
    "x-timestamp": timestampValue,
    ...(query ?? {}),
  }

  const headerString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  const bodyHash = body ? crypto.createHash("md5").update(body).digest("hex").toUpperCase() : undefined
  const signatureBase = bodyHash ? `${path}&${headerString}&${bodyHash}` : `${path}&${headerString}`

  return crypto.createHmac("sha1", `${appSecret}&`).update(encodeURIComponent(signatureBase)).digest("base64")
}

async function webullFetch<T>({
  method,
  path,
  query,
  body,
}: {
  method: WebullMethod
  path: string
  query?: Record<string, string>
  body?: unknown
}) {
  if (!hasWebullConfig()) {
    throw new Error("Webull credentials are missing or the configured access token is expired")
  }

  const host = webullHost()
  const appKey = requiredEnv("WEBULL_APP_KEY")
  const appSecret = requiredEnv("WEBULL_APP_SECRET")
  const accessToken = requiredEnv("WEBULL_ACCESS_TOKEN")
  const timestampValue = timestamp()
  const nonce = crypto.randomUUID().replaceAll("-", "")
  const bodyString = body ? JSON.stringify(body) : undefined

  const signature = signRequest({
    path,
    query,
    body: bodyString,
    host,
    appKey,
    appSecret,
    nonce,
    timestampValue,
  })

  const url = new URL(`https://${host}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(bodyString ? { "Content-Type": "application/json" } : {}),
      "x-app-key": appKey,
      "x-timestamp": timestampValue,
      "x-signature": signature,
      "x-signature-algorithm": "HMAC-SHA1",
      "x-signature-version": "1.0",
      "x-signature-nonce": nonce,
      "x-version": "v2",
      "x-access-token": accessToken,
    },
    body: bodyString,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Webull ${response.status}: ${text.slice(0, 300)}`)
  }

  return data as T
}

export async function getWebullAccounts() {
  if (!hasWebullConfig()) return []

  try {
    return await webullFetch<WebullAccount[]>({ method: "GET", path: ACCOUNT_LIST_PATH })
  } catch (error) {
    console.error("[Webull] getWebullAccounts error:", error)
    return []
  }
}

export const getAccounts = getWebullAccounts

function pickAccount(accounts: WebullAccount[]) {
  const configuredId = process.env.WEBULL_ACCOUNT_ID
  if (configuredId) {
    const configuredAccount = accounts.find((account) => account.account_id === configuredId)
    if (!configuredAccount) throw new Error("WEBULL_ACCOUNT_ID was not found in Webull account list")
    return configuredAccount
  }

  return accounts.find((account) => account.account_type === "CASH") ?? accounts[0]
}

export async function getSelectedWebullAccount() {
  const accounts = await getWebullAccounts()
  const account = pickAccount(accounts)
  if (!account?.account_id) throw new Error("No Webull account found")
  return account
}

export async function getWebullBalance(accountId: string) {
  if (!hasWebullConfig()) return null

  try {
    return await webullFetch<WebullBalance>({
      method: "GET",
      path: BALANCE_PATH,
      query: {
        account_id: accountId,
        total_asset_currency: "USD",
      },
    })
  } catch (error) {
    console.error("[Webull] getWebullBalance error:", error)
    return null
  }
}

export const getAccountBalance = getWebullBalance

export async function getWebullPositions(accountId: string) {
  if (!hasWebullConfig()) return []

  try {
    return await webullFetch<WebullPosition[]>({
      method: "GET",
      path: POSITIONS_PATH,
      query: {
        account_id: accountId,
      },
    })
  } catch (error) {
    console.error("[Webull] getWebullPositions error:", error)
    return []
  }
}

export const getPositions = getWebullPositions

export async function getOpenOrders() {
  return [] as WebullOrder[]
}

export async function getOrderHistory() {
  return [] as WebullOrder[]
}

export async function placeOrder(_params: PlaceOrderParams) {
  throw new Error("Webull trading is disabled in this app. Read-only account access is enabled.")
}

export async function cancelOrder(_accountId: string, _orderId: string) {
  throw new Error("Webull trading is disabled in this app. Read-only account access is enabled.")
}

function asNumber(value: string | number | undefined) {
  return Number(value ?? 0)
}

function asString(value: string | number | undefined) {
  return String(value ?? "0")
}

export async function getAccountSummary(accountId: string): Promise<AccountSummary | null> {
  const accounts = await getWebullAccounts()
  const account = accounts.find((item) => item.account_id === accountId)
  if (!account) return null

  const [balance, positions, openOrders] = await Promise.all([
    getWebullBalance(accountId),
    getWebullPositions(accountId),
    getOpenOrders(),
  ])

  return { account, balance, positions, openOrders }
}

export async function getPrimaryAccountSummary(): Promise<AccountSummary | null> {
  const account = await getSelectedWebullAccount()
  return getAccountSummary(account.account_id)
}

export async function getWebullTradingAccount() {
  const selected = await getSelectedWebullAccount()
  const [balance, positions] = await Promise.all([
    getWebullBalance(selected.account_id),
    getWebullPositions(selected.account_id),
  ])

  const account = {
    id: selected.account_id,
    status: "WEBULL",
    currency: balance.total_asset_currency ?? "USD",
    cash: asString(balance.total_cash_balance),
    portfolio_value: asString(balance.total_net_liquidation_value),
    buying_power: asString(balance.total_cash_balance),
    equity: asString(balance.total_net_liquidation_value),
    last_equity: asString(asNumber(balance.total_net_liquidation_value) - asNumber(balance.total_day_profit_loss)),
    pattern_day_trader: false,
    trading_blocked: false,
    account_blocked: false,
    broker: "webull",
    account_label: selected.account_label,
    account_type: selected.account_type,
  }

  return {
    account,
    positions: positions.map((position) => ({
      symbol: position.symbol ?? "",
      qty: asString(position.quantity),
      avg_entry_price: asString(position.cost_price),
      market_value: asString(position.market_value),
      unrealized_pl: asString(position.unrealized_profit_loss),
      unrealized_plpc: asString(position.unrealized_profit_loss_rate),
      current_price: asString(position.last_price),
      cost_basis: asString(position.cost),
      side: "long" as const,
      broker: "webull",
      instrument_type: position.instrument_type,
      day_profit_loss: asString(position.day_profit_loss),
    })),
  }
}
