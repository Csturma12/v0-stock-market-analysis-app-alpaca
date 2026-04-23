"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function TradingOrderForm() {
  const params = useSearchParams()
  const router = useRouter()

  const [symbol, setSymbol] = useState("")
  const [qty, setQty] = useState(1)
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [type, setType] = useState<"market" | "limit">("market")
  const [limit, setLimit] = useState<number | "">("")
  const [stop, setStop] = useState<number | "">("")
  const [target, setTarget] = useState<number | "">("")
  const [thesis, setThesis] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [prefilled, setPrefilled] = useState(false)

  // Hydrate form from URL params (handoff from AI trade-idea panel)
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
    if (Number.isFinite(lim) && lim > 0) setLimit(lim)
    const stp = Number(params.get("stop"))
    if (Number.isFinite(stp) && stp > 0) setStop(stp)
    const tgt = Number(params.get("target"))
    if (Number.isFinite(tgt) && tgt > 0) setTarget(tgt)
    const th = params.get("thesis")
    if (th) setThesis(th)
    setPrefilled(true)
  }, [params])

  function clearPrefill() {
    setSymbol("")
    setQty(1)
    setSide("buy")
    setType("market")
    setLimit("")
    setStop("")
    setTarget("")
    setThesis("")
    setPrefilled(false)
    router.replace("/trading")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch("/api/trading/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        symbol,
        qty,
        side,
        type,
        limit_price: type === "limit" ? Number(limit) : undefined,
        source: prefilled ? "ai_idea" : "manual",
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ ok: true, text: `Submitted ${side.toUpperCase()} ${qty} ${symbol} — ${data.order.status}` })
      setSymbol("")
      setQty(1)
      setStop("")
      setTarget("")
      setThesis("")
      setPrefilled(false)
      router.replace("/trading")
    } else {
      setMsg({ ok: false, text: data.error ?? "Order failed" })
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">{prefilled ? "Staged AI Trade" : "Manual Order"}</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Paper</span>
      </div>

      {prefilled && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-widest text-primary">Pre-filled from AI idea</span>
            {thesis && <span className="leading-relaxed text-muted-foreground">{thesis}</span>}
            {(stop !== "" || target !== "") && (
              <div className="mt-1 flex gap-3 font-mono text-muted-foreground">
                {stop !== "" && <span>Stop ${Number(stop).toFixed(2)}</span>}
                {target !== "" && <span>Target ${Number(target).toFixed(2)}</span>}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearPrefill}
            className="shrink-0 rounded border border-border bg-background px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("buy")}
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
          onClick={() => setSide("sell")}
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

      <Label text="Symbol">
        <input
          required
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="AAPL"
          className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary"
        />
      </Label>

      <Label text="Quantity">
        <input
          type="number"
          min={1}
          required
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </Label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("market")}
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-colors",
            type === "market" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
          )}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setType("limit")}
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-colors",
            type === "limit" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
          )}
        >
          Limit
        </button>
      </div>

      {type === "limit" && (
        <Label text="Limit price">
          <input
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
          />
        </Label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "Submitting…" : prefilled ? `Submit staged ${side} order` : "Submit order"}
      </button>

      {msg && (
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
      )}
    </form>
  )
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{text}</span>
      {children}
    </label>
  )
}
