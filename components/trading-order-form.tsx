"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type StageParams = {
  symbol?: string
  side?: "buy" | "sell"
  qty?: number
  type?: "limit" | "market"
  limitPrice?: number
  stop?: number
  target?: number
  thesis?: string
  isOption?: boolean
  optionType?: "call" | "put"
  optionStrike?: number
  optionExpiry?: string
  optionAction?: "buy" | "sell"
  optionQty?: number
  optionLimit?: number
}

type OptionContract = {
  id: string
  symbol: string
  expiration_date: string
  strike_price: string
  type: "call" | "put"
  close_price: string | null
  implied_volatility: string | null
  delta: string | null
  open_interest: string | null
}

export function TradingOrderForm({ 
  stageParams,
  formType 
}: { 
  stageParams?: StageParams | null
  formType?: "stock" | "options"
}) {
  const params = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<"stock" | "options">(formType ?? "stock")
  const showTabs = !formType // Only show tabs if no specific formType is provided

  // ── Stock form state ──────────────────────────────────────────────
  const [symbol, setSymbol] = useState("")
  const [qty, setQty] = useState(1)
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [type, setType] = useState<"market" | "limit">("limit")
  const [limit, setLimit] = useState<number | "">("")
  const [stop, setStop] = useState<number | "">("")
  const [target, setTarget] = useState<number | "">("")
  const [thesis, setThesis] = useState("")
  const [prefilled, setPrefilled] = useState(false)
  const [stockBusy, setStockBusy] = useState(false)
  const [stockMsg, setStockMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Options form state ────────────────────────────────────────────
  const [optSym, setOptSym] = useState("")
  const [optType, setOptType] = useState<"call" | "put">("call")
  const [optAction, setOptAction] = useState<"buy" | "sell">("buy")
  const [optExpiry, setOptExpiry] = useState("")
  const [optStrike, setOptStrike] = useState<number | "">("")
  const [optQty, setOptQty] = useState(1)
  const [optLimit, setOptLimit] = useState<number | "">("")
  const [optThesis, setOptThesis] = useState("")
  const [optPrefilled, setOptPrefilled] = useState(false)
  const [contracts, setContracts] = useState<OptionContract[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null)
  const [optBusy, setOptBusy] = useState(false)
  const [optMsg, setOptMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Hydrate from URL params (old handoff path)
  useEffect(() => {
    const sym = params.get("symbol")
    if (!sym) return
    setSymbol(sym.toUpperCase())
    const s = params.get("side")
    if (s === "buy" || s === "sell") setSide(s)
    const q = Number(params.get("qty"))
    if (Number.isFinite(q) && q > 0) setQty(q)
    const t = params.get("type")
    if (t === "market" || t === "limit") setType(t)
    const lim = Number(params.get("limit"))
    if (lim > 0) setLimit(lim)
    const stp = Number(params.get("stop"))
    if (stp > 0) setStop(stp)
    const tgt = Number(params.get("target"))
    if (tgt > 0) setTarget(tgt)
    const th = params.get("thesis")
    if (th) setThesis(th)
    setPrefilled(true)
  }, [params])

  // Hydrate from stageParams prop (new direct handoff from TradingTradeIdea)
  useEffect(() => {
    if (!stageParams) return
    if (stageParams.isOption) {
      setTab("options")
      if (stageParams.symbol) setOptSym(stageParams.symbol)
      if (stageParams.optionType) setOptType(stageParams.optionType)
      if (stageParams.optionAction) setOptAction(stageParams.optionAction)
      if (stageParams.optionExpiry) setOptExpiry(stageParams.optionExpiry)
      if (stageParams.optionStrike) setOptStrike(stageParams.optionStrike)
      if (stageParams.optionQty) setOptQty(stageParams.optionQty)
      if (stageParams.optionLimit) setOptLimit(stageParams.optionLimit)
      if (stageParams.thesis) setOptThesis(stageParams.thesis)
      setOptPrefilled(true)
    } else {
      setTab("stock")
      if (stageParams.symbol) setSymbol(stageParams.symbol)
      if (stageParams.side) setSide(stageParams.side)
      if (stageParams.qty) setQty(stageParams.qty)
      if (stageParams.type) setType(stageParams.type)
      if (stageParams.limitPrice) setLimit(stageParams.limitPrice)
      if (stageParams.stop) setStop(stageParams.stop)
      if (stageParams.target) setTarget(stageParams.target)
      if (stageParams.thesis) setThesis(stageParams.thesis)
      setPrefilled(true)
    }
  }, [stageParams])

  function clearStock() {
    setSymbol(""); setQty(1); setSide("buy"); setType("limit")
    setLimit(""); setStop(""); setTarget(""); setThesis("")
    setPrefilled(false); router.replace("/trading")
  }

  function clearOptions() {
    setOptSym(""); setOptType("call"); setOptAction("buy"); setOptExpiry("")
    setOptStrike(""); setOptQty(1); setOptLimit(""); setOptThesis("")
    setOptPrefilled(false); setSelectedContract(null); setContracts([])
  }

  async function searchContracts() {
    if (!optSym.trim()) return
    setContractsLoading(true)
    setContracts([])
    setSelectedContract(null)
    const today = new Date().toISOString().slice(0, 10)
    const in90 = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10)
    const qs = new URLSearchParams({
      underlying: optSym.toUpperCase(),
      type: optType,
      expiration_gte: today,
      expiration_lte: in90,
    })
    try {
      const res = await fetch(`/api/trading/options/contracts?${qs}`)
      const data = await res.json()
      setContracts(data.contracts ?? [])
    } catch {
      setContracts([])
    } finally {
      setContractsLoading(false)
    }
  }

  async function submitStock(e: React.FormEvent) {
    e.preventDefault()
    setStockBusy(true); setStockMsg(null)
    const res = await fetch("/api/trading/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        symbol, qty, side, type,
        limit_price: type === "limit" ? Number(limit) : undefined,
        source: prefilled ? "ai_idea" : "manual",
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setStockMsg({ ok: true, text: `Submitted ${side.toUpperCase()} ${qty} ${symbol} — ${data.order.status}` })
      clearStock()
    } else {
      setStockMsg({ ok: false, text: data.error ?? "Order failed" })
    }
    setStockBusy(false)
  }

  async function submitOption(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContract) { setOptMsg({ ok: false, text: "Select a contract first" }); return }
    setOptBusy(true); setOptMsg(null)
    const res = await fetch("/api/trading/options/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        occSymbol: selectedContract.symbol,
        qty: optQty,
        side: optAction,
        type: optLimit ? "limit" : "market",
        limit_price: optLimit ? Number(optLimit) : undefined,
        source: optPrefilled ? "ai_idea" : "manual",
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setOptMsg({ ok: true, text: `Submitted ${optAction.toUpperCase()} ${optQty}x ${selectedContract.symbol} — ${data.order.status}` })
      clearOptions()
    } else {
      setOptMsg({ ok: false, text: data.error ?? "Options order failed" })
    }
    setOptBusy(false)
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar — only shown if no formType is specified */}
      {showTabs && (
        <div className="flex border-b border-border rounded-t-lg overflow-hidden">
          {(["stock", "options"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "stock" ? "Stock / ETF" : "Options"}
            </button>
          ))}
        </div>
      )}

      {/* Stock tab */}
      {tab === "stock" && (
        <form onSubmit={submitStock} className="flex flex-col gap-3">
          {prefilled && (
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">Staged AI Trade</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Paper</span>
            </div>
          )}

          {prefilled && (
            <div className="flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-mono uppercase tracking-widest text-primary">Pre-filled from AI idea</span>
                {thesis && <p className="leading-relaxed text-muted-foreground">{thesis}</p>}
                <div className="mt-1 flex gap-3 font-mono text-muted-foreground">
                  {stop !== "" && <span>Stop ${Number(stop).toFixed(2)}</span>}
                  {target !== "" && <span>Target ${Number(target).toFixed(2)}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={clearStock}
                className="shrink-0 rounded border border-border bg-background px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}

          <BuySellToggle side={side} onChange={setSide} />

          <Field label="Symbol">
            <input
              required value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className={inputCls}
            />
          </Field>

          <Field label="Quantity">
            <input type="number" min={1} required value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            {(["market", "limit"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={cn("rounded-md border px-3 py-2 text-sm transition-colors",
                  type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {type === "limit" && (
            <Field label="Limit price">
              <input type="number" step="0.01" value={limit}
                onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          )}

          {(stop !== "" || target !== "") && (
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {stop !== "" && (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                  <span className="block font-mono uppercase tracking-widest">Stop</span>
                  <span className="font-mono font-semibold text-[color:var(--color-bear)]">${Number(stop).toFixed(2)}</span>
                </div>
              )}
              {target !== "" && (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                  <span className="block font-mono uppercase tracking-widest">Target</span>
                  <span className="font-mono font-semibold text-[color:var(--color-bull)]">${Number(target).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={stockBusy}
            className="mt-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {stockBusy ? "Submitting…" : prefilled ? `Submit staged ${side} order` : "Submit order"}
          </button>

          {stockMsg && <StatusMsg msg={stockMsg} />}
        </form>
      )}

      {/* Options tab */}
      {tab === "options" && (
        <form onSubmit={submitOption} className="flex flex-col gap-3">
          {optPrefilled && (
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">Staged Options Play</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Paper</span>
            </div>
          )}

          {optPrefilled && (
            <div className="flex items-start justify-between gap-3 rounded-md border border-amber-400/40 bg-amber-400/5 p-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-mono uppercase tracking-widest text-amber-400">Pre-filled from AI idea</span>
                {optThesis && <p className="leading-relaxed text-muted-foreground">{optThesis}</p>}
              </div>
              <button type="button" onClick={clearOptions}
                className="shrink-0 rounded border border-border bg-background px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}

          {/* Buy / Sell */}
          <BuySellToggle side={optAction} onChange={setOptAction} />

          {/* Call / Put */}
          <div className="grid grid-cols-2 gap-2">
            {(["call", "put"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setOptType(t)}
                className={cn("rounded-md border px-3 py-2 text-sm font-medium transition-colors uppercase tracking-widest font-mono text-xs",
                  optType === t
                    ? t === "call"
                      ? "border-[color:var(--color-bull)]/50 bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]"
                      : "border-[color:var(--color-bear)]/50 bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]"
                    : "border-border text-muted-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Underlying + Search */}
          <div className="flex gap-2">
            <Field label="Underlying" className="flex-1">
              <input
                value={optSym}
                onChange={(e) => setOptSym(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={inputCls}
              />
            </Field>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={searchContracts}
                disabled={contractsLoading || !optSym.trim()}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                {contractsLoading ? "…" : "Search"}
              </button>
            </div>
          </div>

          {/* Contract picker */}
          {contracts.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md border border-border bg-background">
              <div className="grid grid-cols-4 gap-1 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <span>Expiry</span>
                <span>Strike</span>
                <span>Last</span>
                <span>IV</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {contracts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedContract(c)
                      setOptExpiry(c.expiration_date)
                      setOptStrike(Number(c.strike_price))
                      if (c.close_price) setOptLimit(Number(c.close_price))
                    }}
                    className={cn(
                      "grid w-full grid-cols-4 gap-1 px-3 py-1.5 text-left font-mono text-xs transition-colors hover:bg-muted",
                      selectedContract?.id === c.id && "bg-primary/10 text-primary",
                    )}
                  >
                    <span>{c.expiration_date}</span>
                    <span>${c.strike_price}</span>
                    <span>{c.close_price ? `$${Number(c.close_price).toFixed(2)}` : "—"}</span>
                    <span>{c.implied_volatility ? `${(Number(c.implied_volatility) * 100).toFixed(0)}%` : "—"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedContract && (
            <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 font-mono text-xs">
              <span className="text-primary">Selected: </span>
              <span className="font-semibold">{selectedContract.symbol}</span>
              {selectedContract.delta && (
                <span className="ml-2 text-muted-foreground">δ {Number(selectedContract.delta).toFixed(2)}</span>
              )}
              {selectedContract.open_interest && (
                <span className="ml-2 text-muted-foreground">OI {Number(selectedContract.open_interest).toLocaleString()}</span>
              )}
            </div>
          )}

          <Field label="Contracts (qty)">
            <input type="number" min={1} value={optQty}
              onChange={(e) => setOptQty(Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          <Field label="Limit price (per contract)">
            <input type="number" step="0.01" value={optLimit}
              onChange={(e) => setOptLimit(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Leave blank for market"
              className={inputCls}
            />
          </Field>

          <button
            type="submit"
            disabled={optBusy || !selectedContract}
            className="mt-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {optBusy
              ? "Submitting…"
              : selectedContract
                ? `Submit ${optAction.toUpperCase()} ${optQty}x ${optType.toUpperCase()}`
                : "Select a contract"}
          </button>

          {optMsg && <StatusMsg msg={optMsg} />}
        </form>
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────

const inputCls =
  "rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary w-full"

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function BuySellToggle({
  side,
  onChange,
}: {
  side: "buy" | "sell"
  onChange: (s: "buy" | "sell") => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("buy")}
        className={cn(
          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          side === "buy"
            ? "border-[color:var(--color-bull)] bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]"
            : "border-border text-muted-foreground",
        )}
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onChange("sell")}
        className={cn(
          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          side === "sell"
            ? "border-[color:var(--color-bear)] bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]"
            : "border-border text-muted-foreground",
        )}
      >
        Sell
      </button>
    </div>
  )
}

function StatusMsg({ msg }: { msg: { ok: boolean; text: string } }) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-xs",
        msg.ok
          ? "border-[color:var(--color-bull)]/40 bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]"
          : "border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]",
      )}
    >
      {msg.text}
    </div>
  )
}
