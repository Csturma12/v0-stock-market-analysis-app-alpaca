"use client"

import Link from "next/link"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TradingPositions() {
  const { data } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const positions = (data?.positions ?? []) as any[]

  return (
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
                      <Link href={`/ticker/${p.symbol}`} className="font-mono text-sm font-semibold hover:text-primary">
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
  )
}
