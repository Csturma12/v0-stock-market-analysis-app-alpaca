"use client"

import Link from "next/link"
import useSWR from "swr"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Alpaca order statuses that represent a pending (working) order
const PENDING_STATUSES = new Set([
  "new",
  "accepted",
  "partially_filled",
  "pending_new",
  "accepted_for_bidding",
  "pending_replace",
  "pending_cancel",
  "held",
  "replaced",
])

function fmtTime(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function TradingPositions() {
  const { data, mutate } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const positions = (data?.positions ?? []) as any[]
  const orders = (data?.orders ?? []) as any[]
  const pending = orders.filter((o) => PENDING_STATUSES.has(o.status))

  async function cancel(id: string) {
    await fetch(`/api/trading/order/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-6">
      {/* Open Positions */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-baseline justify-between px-5 py-4">
          <h3 className="text-base font-semibold">Open Positions</h3>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {positions.length} {positions.length === 1 ? "position" : "positions"}
          </span>
        </div>
        <div className="overflow-hidden border-t border-border">
          {positions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No open positions.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Symbol</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Avg</th>
                  <th className="px-4 py-2.5 text-right">Mkt</th>
                  <th className="px-4 py-2.5 text-right">P&amp;L</th>
                  <th className="px-4 py-2.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const pl = Number(p.unrealized_pl)
                  const plPct = Number(p.unrealized_plpc) * 100
                  const up = pl >= 0
                  return (
                    <tr key={p.symbol} className="border-t border-border/60 hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/ticker/${p.symbol}`}
                          className="font-mono text-sm font-semibold hover:text-primary"
                        >
                          {p.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{p.qty}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                        ${Number(p.avg_entry_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                        ${Number(p.current_price).toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-mono text-sm tabular-nums",
                          up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]",
                        )}
                      >
                        {up ? "+" : ""}${pl.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-mono text-sm tabular-nums",
                          up ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]",
                        )}
                      >
                        {up ? "+" : ""}
                        {plPct.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending Orders */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-baseline justify-between px-5 py-4">
          <h3 className="text-base font-semibold">Pending Orders</h3>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {pending.length} {pending.length === 1 ? "order" : "orders"}
          </span>
        </div>
        <div className="overflow-hidden border-t border-border">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No pending orders.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Symbol</th>
                  <th className="px-4 py-2.5 text-left">Side</th>
                  <th className="px-4 py-2.5 text-left">Type</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Limit</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Submitted</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((o) => {
                  const isBuy = o.side === "buy"
                  return (
                    <tr key={o.id} className="border-t border-border/60 hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/ticker/${o.symbol}`}
                          className="font-mono text-sm font-semibold hover:text-primary"
                        >
                          {o.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 font-mono text-xs font-semibold uppercase",
                            isBuy
                              ? "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]"
                              : "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
                          )}
                        >
                          {o.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{o.type}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                        {Number(o.filled_qty) > 0 ? (
                          <span>
                            <span className="text-muted-foreground">{o.filled_qty}/</span>
                            {o.qty}
                          </span>
                        ) : (
                          o.qty
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                        {o.limit_price ? `$${Number(o.limit_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">
                        {String(o.status).replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtTime(o.submitted_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => cancel(o.id)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-[color:var(--color-bear)]/50 hover:text-[color:var(--color-bear)]"
                          aria-label={`Cancel order ${o.id}`}
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
