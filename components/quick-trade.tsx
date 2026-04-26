"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, DollarSign, Hash,
} from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Side = "buy" | "sell"
type OrderType = "market" | "limit"
type SizeMode = "shares" | "notional"

type OrderResult = {
  id: string
  symbol: string
  qty: string
  side: string
  type: string
  status: string
  filled_avg_price: string | null
}

export function QuickTrade() {
  const [ticker, setTicker]           = useState("")
  const [side, setSide]               = useState<Side>("buy")
  const [orderType, setOrderType]     = useState<OrderType>("market")
  const [sizeMode, setSizeMode]       = useState<SizeMode>("notional")
  const [sizeValue, setSizeValue]     = useState("")
  const [limitPrice, setLimitPrice]   = useState("")
  const [confirming, setConfirming]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<OrderResult | null>(null)
  const [error, setError]             = useState<string | null>(null)

  const tickerRef = useRef<HTMLInputElement>(null)

  // Live quote for entered ticker
  const sym = ticker.trim().toUpperCase()
  const { data: quoteData } = useSWR(
    sym.length >= 1 ? `/api/market/subindustry?tickers=${sym}` : null,
    fetcher,
    { refreshInterval: 10_000 }
  )
  const quote = quoteData?.data?.[0]
  const livePrice: number | null = quote?.price ?? null

  const estimatedValue = (() => {
    if (!sizeValue) return null
    const num = parseFloat(sizeValue)
    if (isNaN(num) || num <= 0) return null
    if (sizeMode === "shares") {
      const p = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : livePrice
      return p ? num * p : null
    }
    return num
  })()

  const estimatedShares = (() => {
    if (!sizeValue) return null
    const num = parseFloat(sizeValue)
    if (isNaN(num) || num <= 0) return null
    if (sizeMode === "notional") {
      const p = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : livePrice
      return p ? num / p : null
    }
    return num
  })()

  function reset() {
    setConfirming(false)
    setResult(null)
    setError(null)
    setSizeValue("")
    setLimitPrice("")
    setTicker("")
    tickerRef.current?.focus()
  }

  async function submitOrder() {
    if (!sym || !sizeValue) return
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        symbol: sym,
        side,
        type: orderType,
        time_in_force: "day",
        source: "quick-trade",
      }
      if (sizeMode === "shares") {
        body.qty = parseFloat(sizeValue)
      } else {
        body.notional = parseFloat(sizeValue)
      }
      if (orderType === "limit" && limitPrice) {
        body.limit_price = parseFloat(limitPrice)
      }

      const res = await fetch("/api/trading/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.order)
      setConfirming(false)
    } catch (e: any) {
      setError(e.message || "Order failed")
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = sym.length > 0 && parseFloat(sizeValue) > 0 && (orderType === "market" || parseFloat(limitPrice) > 0)

  // ---- Result state ----
  if (result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-[color:var(--color-bull)]" />
        <div>
          <p className="font-mono text-sm font-bold uppercase text-foreground">
            {result.side === "buy" ? "Bought" : "Sold"} {result.symbol}
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Status: <span className="text-foreground capitalize">{result.status}</span>
            {result.filled_avg_price && (
              <> · Avg fill: <span className="text-[color:var(--color-bull)]">${parseFloat(result.filled_avg_price).toFixed(2)}</span></>
            )}
          </p>
        </div>
        <button
          onClick={reset}
          className="mt-1 rounded-md border border-border/50 px-4 py-1.5 font-mono text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          New Order
        </button>
      </div>
    )
  }

  // ---- Confirm state ----
  if (confirming) {
    return (
      <div className="flex h-full flex-col justify-between p-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Confirm Order</p>
          <div className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-3">
            <Row label="Ticker" value={sym} />
            <Row label="Side" value={side.toUpperCase()} className={side === "buy" ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"} />
            <Row label="Type" value={orderType.toUpperCase()} />
            {sizeMode === "shares"
              ? <Row label="Shares" value={sizeValue} />
              : <Row label="Notional" value={`$${sizeValue}`} />
            }
            {orderType === "limit" && limitPrice && <Row label="Limit" value={`$${limitPrice}`} />}
            {estimatedValue != null && <Row label="Est. Value" value={`~$${estimatedValue.toFixed(2)}`} />}
            {estimatedShares != null && sizeMode === "notional" && <Row label="Est. Shares" value={`~${estimatedShares.toFixed(4)}`} />}
            {livePrice && <Row label="Live Price" value={`$${livePrice.toFixed(2)}`} />}
          </div>
          <p className="mt-2 font-mono text-[9px] text-amber-400/80">
            This is a paper trading account. No real money at risk.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-md border border-border/50 py-2 font-mono text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitOrder}
            disabled={loading}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-mono text-xs font-bold uppercase transition-colors",
              side === "buy"
                ? "bg-[color:var(--color-bull)] text-black hover:bg-[color:var(--color-bull)]/90"
                : "bg-[color:var(--color-bear)] text-white hover:bg-[color:var(--color-bear)]/90"
            )}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {loading ? "Placing..." : `Confirm ${side.toUpperCase()}`}
          </button>
        </div>
      </div>
    )
  }

  // ---- Main form ----
  return (
    <div className="flex h-full flex-col overflow-hidden p-2 gap-2">
      {/* Ticker + live price */}
      <div className="flex items-center gap-2">
        <input
          ref={tickerRef}
          value={ticker}
          onChange={(e) => {
            setTicker(e.target.value.toUpperCase())
            setResult(null)
            setError(null)
          }}
          placeholder="TICKER"
          maxLength={8}
          className="w-24 rounded border border-border/50 bg-background px-2 py-1.5 font-mono text-xs uppercase placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
        />
        {livePrice != null ? (
          <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            ${livePrice.toFixed(2)}
          </span>
        ) : sym ? (
          <span className="font-mono text-xs text-muted-foreground/40">—</span>
        ) : null}
        {quote?.changePct != null && (
          <span className={cn(
            "font-mono text-[10px] tabular-nums",
            quote.changePct >= 0 ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
          )}>
            {quote.changePct >= 0 ? "+" : ""}{quote.changePct.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "rounded py-1.5 font-mono text-[10px] font-bold uppercase transition-colors",
            side === "buy"
              ? "bg-[color:var(--color-bull)] text-black"
              : "border border-border/40 text-muted-foreground hover:border-[color:var(--color-bull)]/50 hover:text-[color:var(--color-bull)]"
          )}
        >
          <TrendingUp className="inline h-3 w-3 mr-1" />Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={cn(
            "rounded py-1.5 font-mono text-[10px] font-bold uppercase transition-colors",
            side === "sell"
              ? "bg-[color:var(--color-bear)] text-white"
              : "border border-border/40 text-muted-foreground hover:border-[color:var(--color-bear)]/50 hover:text-[color:var(--color-bear)]"
          )}
        >
          <TrendingDown className="inline h-3 w-3 mr-1" />Sell
        </button>
      </div>

      {/* Order type */}
      <div className="grid grid-cols-2 gap-1">
        {(["market", "limit"] as OrderType[]).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={cn(
              "rounded py-1 font-mono text-[9px] uppercase transition-colors",
              orderType === t
                ? "border border-primary/60 bg-primary/10 text-primary"
                : "border border-border/30 text-muted-foreground/60 hover:border-border"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Size mode + value */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSizeMode(sizeMode === "shares" ? "notional" : "shares")}
          className="flex shrink-0 items-center gap-0.5 rounded border border-border/40 px-1.5 py-1 font-mono text-[9px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          title="Toggle shares / dollar amount"
        >
          {sizeMode === "shares" ? <Hash className="h-2.5 w-2.5" /> : <DollarSign className="h-2.5 w-2.5" />}
          {sizeMode === "shares" ? "SHS" : "USD"}
          <ChevronDown className="h-2 w-2" />
        </button>
        <input
          type="number"
          min="0"
          value={sizeValue}
          onChange={(e) => setSizeValue(e.target.value)}
          placeholder={sizeMode === "shares" ? "0 shares" : "0.00"}
          className="flex-1 rounded border border-border/50 bg-background px-2 py-1.5 font-mono text-xs tabular-nums placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Limit price (only if limit) */}
      {orderType === "limit" && (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] text-muted-foreground/60 w-14 shrink-0">Limit $</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={livePrice ? livePrice.toFixed(2) : "0.00"}
            className="flex-1 rounded border border-border/50 bg-background px-2 py-1.5 font-mono text-xs tabular-nums placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {/* Est. value summary */}
      {estimatedValue != null && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-muted-foreground/60">Est. Value</span>
          <span className="font-mono text-[10px] tabular-nums text-foreground/70">~${estimatedValue.toFixed(2)}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 rounded border border-[color:var(--color-bear)]/30 bg-[color:var(--color-bear)]/10 px-2 py-1.5">
          <AlertCircle className="h-3 w-3 shrink-0 text-[color:var(--color-bear)]" />
          <span className="font-mono text-[9px] text-[color:var(--color-bear)] leading-tight">{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={() => setConfirming(true)}
        disabled={!canSubmit}
        className={cn(
          "mt-auto w-full rounded py-2 font-mono text-xs font-bold uppercase transition-colors disabled:opacity-40",
          side === "buy"
            ? "bg-[color:var(--color-bull)] text-black hover:bg-[color:var(--color-bull)]/90"
            : "bg-[color:var(--color-bear)] text-white hover:bg-[color:var(--color-bear)]/90"
        )}
      >
        Review {side === "buy" ? "Buy" : "Sell"} Order
      </button>
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] text-muted-foreground/60">{label}</span>
      <span className={cn("font-mono text-[10px] tabular-nums text-foreground", className)}>{value}</span>
    </div>
  )
}
