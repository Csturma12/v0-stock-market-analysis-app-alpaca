const BASE = "https://api.unusualwhales.com/api"

function headers() {
  const key = process.env.UNUSUAL_WHALES_API_KEY
  if (!key) throw new Error("UNUSUAL_WHALES_API_KEY is not set")
  return {
    Authorization: `Bearer ${key}`,
    "UW-CLIENT-API-ID": "100001",
    Accept: "application/json",
  }
}

async function uwFetch<T>(path: string): Promise<T | null> {
  try {
    const url = `${BASE}${path}`
    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate: 60 },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.log("[v0] UW fetch failed", path, res.status, body.slice(0, 200))
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.log("[v0] UW fetch error", path, err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DarkPoolPrint = {
  executedAt: string
  price: number
  size: number
  premium: number
  marketCenter?: string
}

export type FlowAlert = {
  createdAt: string
  optionChain: string
  ticker: string
  type: "call" | "put"
  strike: number
  expiry: string
  premium: number
  volume: number
  openInterest: number
  side: "ask" | "bid" | "mid"
  sentiment: "bullish" | "bearish" | "neutral"
  isSweep?: boolean
  isBlock?: boolean
}

export type VolatilityData = {
  date: string
  iv30: number | null
  iv60: number | null
  iv90: number | null
  hv30: number | null
  ivRank: number | null
  ivPercentile: number | null
}

export type ShortInterest = {
  date: string
  shortInterest: number
  shortPercentFloat: number
  daysToCover: number
  shortRatio: number
}

export type EarningsHistory = {
  reportDate: string
  fiscalQuarter: string
  epsEstimate: number | null
  epsActual: number | null
  epsSurprise: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  priceMove: number | null
}

export type FinancialPeriod = {
  period: string
  revenue: number | null
  netIncome: number | null
  grossProfit: number | null
  operatingIncome: number | null
  totalAssets: number | null
  totalLiabilities: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
  epsActual: number | null
  epsEstimate: number | null
}

export type AnalystRating = {
  date: string
  firm: string
  analyst: string | null
  rating: string
  priorRating: string | null
  priceTarget: number | null
  priorPriceTarget: number | null
  action: "upgrade" | "downgrade" | "initiated" | "reiterated" | "other"
}

export type InsiderTrade = {
  executedAt: string
  insiderName: string
  insiderTitle: string
  company: string
  ticker: string
  transactionType: "BUY" | "SELL" | "OTHER"
  shares: number
  price: number
  value: number
  percentOfHoldings: number | null
}

export type EtfExposure = {
  etfSymbol: string
  etfName: string
  weight: number
  shares: number
  marketValue: number
}

export type EtfHolding = {
  ticker: string
  name: string
  weight: number
  shares: number
  marketValue: number
}

export type CongressionalTrade = {
  executedAt: string
  politicianName: string
  chamber: "House" | "Senate"
  transactionType: "BUY" | "SELL" | "OTHER"
  company: string
  ticker: string
  shares: number
  price: number
  value: number
  disclosure: string
}

export type SectorFlow = {
  sector: string
  callPremium: number
  putPremium: number
  netPremium: number
  callPutRatio: number
}

export type CorrelationPair = {
  ticker1: string
  ticker2: string
  correlation: number
  period: string
}

export type EconomicEvent = {
  date: string
  time: string
  event: string
  country: string
  importance: "low" | "medium" | "high"
  actual: string | null
  forecast: string | null
  previous: string | null
}

export type CryptoWhale = {
  timestamp: string
  coin: string
  amount: number
  usdValue: number
  txType: "transfer" | "exchange_inflow" | "exchange_outflow"
  from: string
  to: string
}

export type HottestChain = {
  ticker: string
  optionChain: string
  totalPremium: number
  totalVolume: number
  callPremium: number
  putPremium: number
  sentiment: "bullish" | "bearish" | "neutral"
}

export type UWSummary = {
  darkPool: {
    prints: DarkPoolPrint[]
    totalPremium: number
    totalSize: number
    largestPrint: DarkPoolPrint | null
  }
  flow: {
    alerts: FlowAlert[]
    callPremium: number
    putPremium: number
    callPutRatio: number
    bullishCount: number
    bearishCount: number
  }
  greekExposure: {
    callGamma: number | null
    putGamma: number | null
    callDelta: number | null
    putDelta: number | null
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS - Per Ticker
// ─────────────────────────────────────────────────────────────────────────────

export async function getVolatility(symbol: string): Promise<VolatilityData[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/volatility/historical`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 90).map((d: any) => ({
    date: d.date ?? "",
    iv30: d.iv_30 ?? d.implied_volatility_30 ?? null,
    iv60: d.iv_60 ?? d.implied_volatility_60 ?? null,
    iv90: d.iv_90 ?? d.implied_volatility_90 ?? null,
    hv30: d.hv_30 ?? d.historical_volatility_30 ?? null,
    ivRank: d.iv_rank ?? null,
    ivPercentile: d.iv_percentile ?? null,
  }))
}

export async function getShortInterest(symbol: string): Promise<ShortInterest[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/short-interest`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 52).map((d: any) => ({
    date: d.date ?? d.settlement_date ?? "",
    shortInterest: Number(d.short_interest ?? 0),
    shortPercentFloat: Number(d.short_percent_of_float ?? d.percent_of_float ?? 0),
    daysToCover: Number(d.days_to_cover ?? 0),
    shortRatio: Number(d.short_ratio ?? 0),
  }))
}

export async function getEarningsHistory(symbol: string): Promise<EarningsHistory[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/earnings`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 20).map((d: any) => ({
    reportDate: d.report_date ?? d.date ?? "",
    fiscalQuarter: d.fiscal_quarter ?? d.quarter ?? "",
    epsEstimate: d.eps_estimate ?? d.estimated_eps ?? null,
    epsActual: d.eps_actual ?? d.reported_eps ?? null,
    epsSurprise: d.eps_surprise ?? null,
    revenueEstimate: d.revenue_estimate ?? null,
    revenueActual: d.revenue_actual ?? d.revenue ?? null,
    priceMove: d.price_move ?? d.post_earnings_move ?? null,
  }))
}

export async function getFinancials(symbol: string): Promise<FinancialPeriod[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/financials`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 16).map((d: any) => ({
    period: d.period ?? d.fiscal_period ?? "",
    revenue: d.revenue ?? d.total_revenue ?? null,
    netIncome: d.net_income ?? null,
    grossProfit: d.gross_profit ?? null,
    operatingIncome: d.operating_income ?? null,
    totalAssets: d.total_assets ?? null,
    totalLiabilities: d.total_liabilities ?? null,
    operatingCashFlow: d.operating_cash_flow ?? null,
    freeCashFlow: d.free_cash_flow ?? null,
    epsActual: d.eps ?? d.eps_actual ?? null,
    epsEstimate: d.eps_estimate ?? null,
  }))
}

export async function getAnalystRatings(symbol: string): Promise<AnalystRating[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/analyst-ratings`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 50).map((d: any) => {
    const rating = (d.rating ?? d.new_rating ?? "").toLowerCase()
    const prior = (d.prior_rating ?? d.old_rating ?? "").toLowerCase()
    let action: AnalystRating["action"] = "other"
    if (d.action) {
      const a = d.action.toLowerCase()
      if (a.includes("upgrade")) action = "upgrade"
      else if (a.includes("downgrade")) action = "downgrade"
      else if (a.includes("init")) action = "initiated"
      else if (a.includes("reiter")) action = "reiterated"
    } else if (rating && prior) {
      const ratingRank = ["sell", "underweight", "hold", "neutral", "overweight", "buy", "strong buy"]
      const ri = ratingRank.findIndex((r) => rating.includes(r))
      const pi = ratingRank.findIndex((r) => prior.includes(r))
      if (ri > pi) action = "upgrade"
      else if (ri < pi) action = "downgrade"
      else action = "reiterated"
    }
    return {
      date: d.date ?? d.rating_date ?? "",
      firm: d.firm ?? d.analyst_firm ?? "",
      analyst: d.analyst ?? d.analyst_name ?? null,
      rating: d.rating ?? d.new_rating ?? "",
      priorRating: d.prior_rating ?? d.old_rating ?? null,
      priceTarget: d.price_target ?? d.pt ?? null,
      priorPriceTarget: d.prior_price_target ?? d.old_pt ?? null,
      action,
    }
  })
}

export async function getInsiderTrades(symbol: string): Promise<InsiderTrade[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/insider-trades?limit=50`)
  if (!res?.data) return []
  return (res.data as any[]).map((t: any) => ({
    executedAt: t.executed_at ?? t.filing_date ?? "",
    insiderName: t.insider_name ?? t.filer_name ?? "",
    insiderTitle: t.insider_title ?? t.title ?? "",
    company: t.company ?? sym,
    ticker: sym,
    transactionType: ((t.transaction_type ?? "OTHER").toUpperCase() as any) || "OTHER",
    shares: Number(t.shares ?? t.volume ?? 0),
    price: Number(t.price ?? 0),
    value: Number(t.total_value ?? Number(t.price ?? 0) * Number(t.shares ?? 0)),
    percentOfHoldings: t.percent_of_holdings ? Number(t.percent_of_holdings) : null,
  }))
}

export async function getEtfExposure(symbol: string): Promise<EtfExposure[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/etf-exposure`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 30).map((d: any) => ({
    etfSymbol: d.etf_ticker ?? d.etf ?? "",
    etfName: d.etf_name ?? "",
    weight: Number(d.weight ?? d.percent ?? 0),
    shares: Number(d.shares ?? 0),
    marketValue: Number(d.market_value ?? 0),
  }))
}

export async function getEtfHoldings(etfSymbol: string): Promise<EtfHolding[]> {
  const sym = etfSymbol.toUpperCase()
  const res = await uwFetch<any>(`/etf/${sym}/holdings`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 50).map((d: any) => ({
    ticker: d.ticker ?? d.symbol ?? "",
    name: d.name ?? d.company ?? "",
    weight: Number(d.weight ?? d.percent ?? 0),
    shares: Number(d.shares ?? 0),
    marketValue: Number(d.market_value ?? 0),
  }))
}

export async function getCongressionalTrades(symbol: string): Promise<CongressionalTrade[]> {
  const sym = symbol.toUpperCase()
  const res = await uwFetch<any>(`/stock/${sym}/congressional-trades?limit=50`)
  if (!res?.data) return []
  return (res.data as any[]).map((t: any) => ({
    executedAt: t.executed_at ?? t.transaction_date ?? t.disclosure_date ?? "",
    politicianName: t.politician_name ?? t.representative ?? "",
    chamber: (t.chamber ?? "House").includes("Senate") ? "Senate" : "House",
    transactionType: ((t.transaction_type ?? "OTHER").toUpperCase() as any) || "OTHER",
    company: t.company ?? "",
    ticker: t.ticker ?? sym,
    shares: Number(t.shares ?? t.quantity ?? 0),
    price: Number(t.price ?? 0),
    value: Number(t.total_value ?? Number(t.price ?? 0) * Number(t.shares ?? 0)),
    disclosure: t.disclosure_type ?? t.type ?? "",
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS - Market Wide
// ─────────────────────────────────────────────────────────────────────────────

export async function getMarketDarkPool(limit = 100): Promise<DarkPoolPrint[]> {
  const res = await uwFetch<any>(`/darkpool?limit=${limit}`)
  if (!res?.data) return []
  return (res.data as any[]).map((d: any) => ({
    executedAt: d.executed_at ?? d.timestamp ?? "",
    price: Number(d.price ?? 0),
    size: Number(d.size ?? 0),
    premium: Number(d.premium ?? Number(d.price ?? 0) * Number(d.size ?? 0)),
    marketCenter: d.market_center ?? d.ticker ?? undefined,
  }))
}

export async function getFlowAlerts(limit = 100): Promise<FlowAlert[]> {
  const res = await uwFetch<any>(`/option-trades/flow-alerts?limit=${limit}`)
  if (!res?.data) return []
  return (res.data as any[]).map((a: any) => {
    const type = (a.type ?? a.option_type ?? "").toLowerCase() === "put" ? "put" : "call"
    const askVol = Number(a.ask_side_volume ?? 0)
    const bidVol = Number(a.bid_side_volume ?? 0)
    const side: "ask" | "bid" | "mid" = askVol > bidVol ? "ask" : bidVol > askVol ? "bid" : "mid"
    let sentiment: FlowAlert["sentiment"] = "neutral"
    if (type === "call" && side === "ask") sentiment = "bullish"
    else if (type === "put" && side === "ask") sentiment = "bearish"
    else if (type === "call" && side === "bid") sentiment = "bearish"
    else if (type === "put" && side === "bid") sentiment = "bullish"
    return {
      createdAt: a.created_at ?? a.executed_at ?? "",
      optionChain: a.option_chain ?? a.option_symbol ?? "",
      ticker: a.ticker ?? a.underlying_symbol ?? "",
      type,
      strike: Number(a.strike ?? 0),
      expiry: a.expiry ?? a.expiration ?? "",
      premium: Number(a.total_premium ?? a.premium ?? 0),
      volume: Number(a.total_size ?? a.volume ?? 0),
      openInterest: Number(a.open_interest ?? 0),
      side,
      sentiment,
      isSweep: a.is_sweep ?? a.sweep ?? false,
      isBlock: (Number(a.total_premium ?? 0) >= 100000) || (a.is_block ?? false),
    }
  })
}

export async function getHottestChains(limit = 20): Promise<HottestChain[]> {
  const res = await uwFetch<any>(`/option-trades/hottest-chains?limit=${limit}`)
  if (!res?.data) return []
  return (res.data as any[]).map((d: any) => {
    const callPrem = Number(d.call_premium ?? 0)
    const putPrem = Number(d.put_premium ?? 0)
    return {
      ticker: d.ticker ?? d.underlying ?? "",
      optionChain: d.option_chain ?? "",
      totalPremium: Number(d.total_premium ?? callPrem + putPrem),
      totalVolume: Number(d.total_volume ?? 0),
      callPremium: callPrem,
      putPremium: putPrem,
      sentiment: callPrem > putPrem * 1.2 ? "bullish" : putPrem > callPrem * 1.2 ? "bearish" : "neutral",
    }
  })
}

export async function getSectorFlow(): Promise<SectorFlow[]> {
  const res = await uwFetch<any>(`/market/sector-etfs`)
  if (!res?.data) return []
  return (res.data as any[]).map((d: any) => ({
    sector: d.sector ?? d.name ?? "",
    callPremium: Number(d.call_premium ?? 0),
    putPremium: Number(d.put_premium ?? 0),
    netPremium: Number(d.net_premium ?? (Number(d.call_premium ?? 0) - Number(d.put_premium ?? 0))),
    callPutRatio: Number(d.put_premium ?? 0) > 0 ? Number(d.call_premium ?? 0) / Number(d.put_premium ?? 1) : 0,
  }))
}

export async function getMarketInsiderTrades(limit = 50): Promise<InsiderTrade[]> {
  const res = await uwFetch<any>(`/insider-trades?limit=${limit}`)
  if (!res?.data) return []
  return (res.data as any[]).map((t: any) => ({
    executedAt: t.executed_at ?? t.filing_date ?? "",
    insiderName: t.insider_name ?? t.filer_name ?? "",
    insiderTitle: t.insider_title ?? t.title ?? "",
    company: t.company ?? "",
    ticker: t.ticker ?? "",
    transactionType: ((t.transaction_type ?? "OTHER").toUpperCase() as any) || "OTHER",
    shares: Number(t.shares ?? t.volume ?? 0),
    price: Number(t.price ?? 0),
    value: Number(t.total_value ?? Number(t.price ?? 0) * Number(t.shares ?? 0)),
    percentOfHoldings: t.percent_of_holdings ? Number(t.percent_of_holdings) : null,
  }))
}

export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  const res = await uwFetch<any>(`/market/economic-calendar`)
  if (!res?.data) return []
  return (res.data as any[]).slice(0, 50).map((d: any) => ({
    date: d.date ?? "",
    time: d.time ?? "",
    event: d.event ?? d.name ?? "",
    country: d.country ?? "US",
    importance: (d.importance ?? d.impact ?? "medium").toLowerCase() as any,
    actual: d.actual ?? null,
    forecast: d.forecast ?? d.consensus ?? null,
    previous: d.previous ?? null,
  }))
}

export async function getCryptoWhales(limit = 50): Promise<CryptoWhale[]> {
  const res = await uwFetch<any>(`/crypto/whale-transactions?limit=${limit}`)
  if (!res?.data) return []
  return (res.data as any[]).map((d: any) => ({
    timestamp: d.timestamp ?? d.time ?? "",
    coin: d.coin ?? d.symbol ?? "",
    amount: Number(d.amount ?? 0),
    usdValue: Number(d.usd_value ?? d.value_usd ?? 0),
    txType: (d.tx_type ?? d.type ?? "transfer") as any,
    from: d.from ?? d.from_address ?? "",
    to: d.to ?? d.to_address ?? "",
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY (combined dark pool + flow + GEX for a ticker)
// ─────────────────────────────────────────────────────────────────────────────

export async function getUnusualWhalesSummary(
  symbol: string,
  period: "previous_session" | "weekly" | "monthly" | "3_month" | "6_month" = "weekly"
): Promise<UWSummary | null> {
  const sym = symbol.toUpperCase()
  const toDate = new Date()
  const daysBack: Record<typeof period, number> = {
    previous_session: 2,
    weekly: 7,
    monthly: 30,
    "3_month": 90,
    "6_month": 180,
  }
  const days = daysBack[period] ?? 7
  const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const darkPoolLimit = period === "previous_session" ? 100 : period === "weekly" ? 200 : 500
  const flowLimit = period === "previous_session" ? 50 : period === "weekly" ? 150 : 300

  const [darkPoolRes, flowRes, gexRes] = await Promise.all([
    uwFetch<any>(`/darkpool/${sym}?limit=${darkPoolLimit}&date_from=${fmt(fromDate)}&date_to=${fmt(toDate)}`),
    uwFetch<any>(`/option-trades/flow-alerts?ticker_symbol=${sym}&limit=${flowLimit}&start_date=${fmt(fromDate)}&end_date=${fmt(toDate)}`),
    uwFetch<any>(`/stock/${sym}/greek-exposure/strike`),
  ])

  const prints: DarkPoolPrint[] = (darkPoolRes?.data ?? []).map((d: any) => ({
    executedAt: d.executed_at ?? d.timestamp ?? "",
    price: Number(d.price ?? 0),
    size: Number(d.size ?? 0),
    premium: Number(d.premium ?? Number(d.price ?? 0) * Number(d.size ?? 0)),
    marketCenter: d.market_center ?? d.tracking_id ?? undefined,
  }))

  const totalSize = prints.reduce((acc, p) => acc + p.size, 0)
  const totalPremium = prints.reduce((acc, p) => acc + p.premium, 0)
  const largestPrint = prints.reduce<DarkPoolPrint | null>((max, p) => (!max || p.premium > max.premium ? p : max), null)

  const alerts: FlowAlert[] = (flowRes?.data ?? []).map((a: any) => {
    const type = (a.type ?? a.option_type ?? "").toLowerCase() === "put" ? "put" : "call"
    const askVol = Number(a.ask_side_volume ?? 0)
    const bidVol = Number(a.bid_side_volume ?? 0)
    const side: "ask" | "bid" | "mid" = askVol > bidVol ? "ask" : bidVol > askVol ? "bid" : "mid"
    let sentiment: FlowAlert["sentiment"] = "neutral"
    if (type === "call" && side === "ask") sentiment = "bullish"
    else if (type === "put" && side === "ask") sentiment = "bearish"
    else if (type === "call" && side === "bid") sentiment = "bearish"
    else if (type === "put" && side === "bid") sentiment = "bullish"
    return {
      createdAt: a.created_at ?? a.executed_at ?? a.start_time ?? "",
      optionChain: a.option_chain ?? a.option_symbol ?? sym,
      ticker: sym,
      type,
      strike: Number(a.strike ?? 0),
      expiry: a.expiry ?? a.expiration ?? "",
      premium: Number(a.total_premium ?? a.premium ?? 0),
      volume: Number(a.total_size ?? a.volume ?? 0),
      openInterest: Number(a.open_interest ?? 0),
      side,
      sentiment,
      isSweep: a.is_sweep ?? a.sweep ?? false,
      isBlock: (Number(a.total_premium ?? 0) >= 100000) || (a.is_block ?? false),
    }
  })

  const callPremium = alerts.filter((a) => a.type === "call").reduce((acc, a) => acc + a.premium, 0)
  const putPremium = alerts.filter((a) => a.type === "put").reduce((acc, a) => acc + a.premium, 0)
  const bullishCount = alerts.filter((a) => a.sentiment === "bullish").length
  const bearishCount = alerts.filter((a) => a.sentiment === "bearish").length
  const callPutRatio = putPremium > 0 ? callPremium / putPremium : callPremium > 0 ? Number.POSITIVE_INFINITY : 0

  const gexRows: any[] = gexRes?.data ?? []
  let greekExposure: UWSummary["greekExposure"] = null
  if (gexRows.length > 0) {
    const sum = (key: string) => gexRows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
    greekExposure = {
      callGamma: sum("call_gamma") || null,
      putGamma: sum("put_gamma") || null,
      callDelta: sum("call_delta") || null,
      putDelta: sum("put_delta") || null,
    }
  }

  return {
    darkPool: { prints, totalPremium, totalSize, largestPrint },
    flow: { alerts, callPremium, putPremium, callPutRatio, bullishCount, bearishCount },
    greekExposure,
  }
}
