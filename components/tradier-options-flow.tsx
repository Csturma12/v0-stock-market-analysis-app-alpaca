"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Activity, TrendingUp, TrendingDown, DollarSign, BarChart2, ChevronDown } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type TradierQuote = {
  symbol: string
  description: string
  last: number
  change: number
  change_percentage: number
  volume: number
  average_volume: number
  open: number
  high: number
  low: number
  prevclose: number
  bid: number
  ask: number
  bidsize: number
  asksize: number
  week_52_high: number
  week_52_low: number
}

type OptionContract = {
  symbol: string
  description: string
  strike: number
  expiration_date: string
  option_type: "call" | "put"
  last: number
  bid: number
  ask: number
  volume: number
  open_interest: number
  greeks?: {
    delta: number
    gamma: number
    theta: number
    vega: number
    mid_iv: number
  }
}

type TradierData = {
  quote: TradierQuote | null
  expirations: string[]
  chain: OptionContract[]
  error?: string
}

const EXPIRATIONS_TO_SHOW = [
  { id: "nearest", label: "Nearest" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] as const

export function TradierOptionsFlow({ symbol }: { symbol: string }) {
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null)
  const [expiryType, setExpiryType] = useState<"nearest" | "weekly" | "monthly">("nearest")
  
  // Fetch quote and expirations
  const { data: baseData, isLoading: baseLoading } = useSWR<{
    quote: TradierQuote | null
    expirations: string[]
  }>(
    `/api/tradier/market?symbol=${symbol.toUpperCase()}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )

  // Select expiration based on type
  useEffect(() => {
    if (!baseData?.expirations?.length) return
    const exps = baseData.expirations.sort()
    
    if (expiryType === "nearest") {
      setSelectedExpiry(exps[0])
    } else if (expiryType === "weekly") {
      // Find nearest weekly (Friday)
      const weekly = exps.find(exp => {
        const d = new Date(exp)
        return d.getDay() === 5 // Friday
      })
      setSelectedExpiry(weekly || exps[0])
    } else {
      // Find nearest monthly (3rd Friday)
      const monthly = exps.find(exp => {
        const d = new Date(exp)
        const day = d.getDate()
        return d.getDay() === 5 && day >= 15 && day <= 21
      })
      setSelectedExpiry(monthly || exps[0])
    }
  }, [baseData?.expirations, expiryType])

  // Fetch option chain for selected expiry
  const { data: chainData, isLoading: chainLoading } = useSWR<{
    chain: OptionContract[]
  }>(
    selectedExpiry ? `/api/tradier/options?symbol=${symbol.toUpperCase()}&expiration=${selectedExpiry}` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )

  const quote = baseData?.quote
  const chain = chainData?.chain || []
  const isLoading = baseLoading || chainLoading

  // Calculate options flow metrics
  const calls = chain.filter(c => c.option_type === "call")
  const puts = chain.filter(c => c.option_type === "put")
  
  const totalCallVolume = calls.reduce((sum, c) => sum + (c.volume || 0), 0)
  const totalPutVolume = puts.reduce((sum, c) => sum + (c.volume || 0), 0)
  const totalCallOI = calls.reduce((sum, c) => sum + (c.open_interest || 0), 0)
  const totalPutOI = puts.reduce((sum, c) => sum + (c.open_interest || 0), 0)
  
  const pcRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0
  const pcOIRatio = totalCallOI > 0 ? totalPutOI / totalCallOI : 0

  // Find most active contracts
  const topCalls = [...calls].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5)
  const topPuts = [...puts].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5)

  // Determine sentiment
  const sentiment = pcRatio < 0.7 ? "bullish" : pcRatio > 1.0 ? "bearish" : "neutral"

  if (isLoading && !quote) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading Tradier data...</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <Activity className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Tradier API not configured or no data available</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with quote */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Tradier</span>
          </div>
          <div className="relative">
            <select
              value={expiryType}
              onChange={(e) => setExpiryType(e.target.value as any)}
              className="appearance-none rounded border border-border bg-card px-2 py-1 pr-6 text-[10px] font-medium text-muted-foreground cursor-pointer hover:bg-muted"
            >
              {EXPIRATIONS_TO_SHOW.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-lg font-bold tabular-nums">${quote.last.toFixed(2)}</span>
          <span className={cn(
            "font-mono text-xs tabular-nums",
            quote.change >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
          )}>
            {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.change_percentage.toFixed(2)}%)
          </span>
        </div>
        
        <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
          <span>Bid: ${quote.bid.toFixed(2)} x {quote.bidsize}</span>
          <span>Ask: ${quote.ask.toFixed(2)} x {quote.asksize}</span>
        </div>
      </div>

      {/* Options Flow Summary */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Options Flow — {selectedExpiry}
            </span>
            <span className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
              sentiment === "bullish" && "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
              sentiment === "bearish" && "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
              sentiment === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {sentiment}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricBox 
              label="Call Volume" 
              value={totalCallVolume.toLocaleString()} 
              color="text-[color:var(--color-bull)]"
            />
            <MetricBox 
              label="Put Volume" 
              value={totalPutVolume.toLocaleString()} 
              color="text-[color:var(--color-bear)]"
            />
            <MetricBox 
              label="P/C Ratio" 
              value={pcRatio.toFixed(2)} 
              color={pcRatio < 0.7 ? "text-[color:var(--color-bull)]" : pcRatio > 1.0 ? "text-[color:var(--color-bear)]" : "text-muted-foreground"}
            />
            <MetricBox 
              label="P/C OI" 
              value={pcOIRatio.toFixed(2)} 
              color={pcOIRatio < 0.7 ? "text-[color:var(--color-bull)]" : pcOIRatio > 1.0 ? "text-[color:var(--color-bear)]" : "text-muted-foreground"}
            />
          </div>
        </div>

        {/* Top Active Calls */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="h-3 w-3 text-[color:var(--color-bull)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top Calls</span>
          </div>
          <div className="space-y-1">
            {topCalls.map((c, i) => (
              <ContractRow key={i} contract={c} spot={quote.last} />
            ))}
            {topCalls.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No call activity</p>
            )}
          </div>
        </div>

        {/* Top Active Puts */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingDown className="h-3 w-3 text-[color:var(--color-bear)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top Puts</span>
          </div>
          <div className="space-y-1">
            {topPuts.map((c, i) => (
              <ContractRow key={i} contract={c} spot={quote.last} />
            ))}
            {topPuts.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No put activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded border border-border/50 bg-background px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-sm font-semibold tabular-nums", color)}>{value}</div>
    </div>
  )
}

function ContractRow({ contract, spot }: { contract: OptionContract; spot: number }) {
  const isCall = contract.option_type === "call"
  const isITM = isCall ? contract.strike < spot : contract.strike > spot
  const delta = contract.greeks?.delta
  const iv = contract.greeks?.mid_iv

  return (
    <div className={cn(
      "flex items-center justify-between rounded border px-2 py-1 text-[10px]",
      isITM ? "border-primary/30 bg-primary/5" : "border-border/50 bg-background"
    )}>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">${contract.strike}</span>
        {isITM && <span className="text-[8px] text-primary">ITM</span>}
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>Vol: {contract.volume?.toLocaleString() || 0}</span>
        <span>OI: {contract.open_interest?.toLocaleString() || 0}</span>
        {delta != null && <span>Δ {delta.toFixed(2)}</span>}
        {iv != null && <span>IV {(iv * 100).toFixed(0)}%</span>}
        <span className="font-semibold text-foreground">${((contract.bid + contract.ask) / 2).toFixed(2)}</span>
      </div>
    </div>
  )
}
