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
  type: "call" | "put"
  strike: number
  expiry: string
  premium: number
  volume: number
  openInterest: number
  side: "ask" | "bid" | "mid"
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

export type InsiderTrade = {
  executedAt: string
  insiderName: string
  insiderTitle: string
  company: string
  transactionType: "BUY" | "SELL" | "OTHER"
  shares: number
  price: number
  value: number
  percentOfHoldings: number | null
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
  disclosure: string // "SELL" | "BUY" | "EXCHANGE" etc
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
    transactionType: ((t.transaction_type ?? "OTHER").toUpperCase() as any) || "OTHER",
    shares: Number(t.shares ?? t.volume ?? 0),
    price: Number(t.price ?? 0),
    value: Number(t.total_value ?? Number(t.price ?? 0) * Number(t.shares ?? 0)),
    percentOfHoldings: t.percent_of_holdings ? Number(t.percent_of_holdings) : null,
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

export async function getUnusualWhalesSummary(
  symbol: string,
  period: "previous_session" | "weekly" | "monthly" | "3_month" | "6_month" = "weekly"
): Promise<UWSummary | null> {
  const sym = symbol.toUpperCase()

  // Map period to Unusual Whales API parameters
  const periodMap: Record<string, string> = {
    previous_session: "today",
    weekly: "week",
    monthly: "month",
    "3_month": "3month",
    "6_month": "6month",
  }

  const interval = periodMap[period] || "week"

  const [darkPoolRes, flowRes, gexRes] = await Promise.all([
    uwFetch<any>(`/darkpool/${sym}?limit=100&interval=${interval}`),
    uwFetch<any>(`/option-trades/flow-alerts?ticker_symbol=${sym}&limit=50&interval=${interval}`),
    uwFetch<any>(`/stock/${sym}/greek-exposure/strike?interval=${interval}`),
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
  const largestPrint = prints.reduce<DarkPoolPrint | null>(
    (max, p) => (!max || p.premium > max.premium ? p : max),
    null,
  )

  const alerts: FlowAlert[] = (flowRes?.data ?? []).map((a: any) => {
    const type = (a.type ?? a.option_type ?? "").toLowerCase() === "put" ? "put" : "call"
    // UW returns ask_side_volume / bid_side_volume — infer which side dominated
    const askVol = Number(a.ask_side_volume ?? 0)
    const bidVol = Number(a.bid_side_volume ?? 0)
    const side: "ask" | "bid" | "mid" = askVol > bidVol ? "ask" : bidVol > askVol ? "bid" : "mid"
    let sentiment: "bullish" | "bearish" | "neutral" = "neutral"
    if (type === "call" && side === "ask") sentiment = "bullish"
    else if (type === "put" && side === "ask") sentiment = "bearish"
    else if (type === "call" && side === "bid") sentiment = "bearish"
    else if (type === "put" && side === "bid") sentiment = "bullish"
    return {
      createdAt: a.created_at ?? a.executed_at ?? a.start_time ?? "",
      optionChain: a.option_chain ?? a.option_symbol ?? sym,
      type,
      strike: Number(a.strike ?? 0),
      expiry: a.expiry ?? a.expiration ?? "",
      premium: Number(a.total_premium ?? a.premium ?? 0),
      volume: Number(a.total_size ?? a.volume ?? 0),
      openInterest: Number(a.open_interest ?? 0),
      side,
      sentiment,
    }
  })

  const callPremium = alerts.filter((a) => a.type === "call").reduce((acc, a) => acc + a.premium, 0)
  const putPremium = alerts.filter((a) => a.type === "put").reduce((acc, a) => acc + a.premium, 0)
  const bullishCount = alerts.filter((a) => a.sentiment === "bullish").length
  const bearishCount = alerts.filter((a) => a.sentiment === "bearish").length
  const callPutRatio = putPremium > 0 ? callPremium / putPremium : callPremium > 0 ? Number.POSITIVE_INFINITY : 0

  // greek-exposure/strike returns per-strike rows — sum them for aggregate exposure
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
    darkPool: {
      prints,
      totalPremium,
      totalSize,
      largestPrint,
    },
    flow: {
      alerts,
      callPremium,
      putPremium,
      callPutRatio,
      bullishCount,
      bearishCount,
    },
    greekExposure,
  }
}
