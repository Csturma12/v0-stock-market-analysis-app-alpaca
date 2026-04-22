"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function TradingOrderForm() {
  const [symbol, setSymbol] = useState("")
  const [qty, setQty] = useState(1)
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [type, setType] = useState<"market" | "limit">("market")
  const [limit, setLimit] = useState<number | "">("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

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
        source: "manual",
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ ok: true, text: `Submitted ${side.toUpperCase()} ${qty} ${symbol} — ${data.order.status}` })
      setSymbol("")
      setQty(1)
    } else {
      setMsg({ ok: false, text: data.error ?? "Order failed" })
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Manual Order</h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Paper</span>
      </div>

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
        {busy ? "Submitting…" : "Submit order"}
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
