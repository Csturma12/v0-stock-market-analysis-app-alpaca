"use client"

import useSWR from "swr"
import Link from "next/link"
import { WidgetFrame } from "./widget-frame"
import { fmtCompact, formatCurrency } from "@/lib/format"

type Props = { symbol: string }

type CongressionalTrade = {
  executedAt: string
  politicianName: string
  chamber: string
  transactionType: string
  ticker: string
  shares: number
  price: number
  value: number
  disclosure: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CongressionalTradesWidget({ symbol }: Props) {
  const { data, isLoading, error } = useSWR<{ trades: CongressionalTrade[] }>(
    `/api/ticker/${symbol}/congressional-trades`,
    fetcher,
    { refreshInterval: 300_000 },
  )

  const trades = data?.trades ?? []
  const buys = trades.filter((t) => /purchase|buy/i.test(t.transactionType))
  const sells = trades.filter((t) => /sale|sell/i.test(t.transactionType))
  const buyValue = buys.reduce((sum, t) => sum + (t.value ?? 0), 0)
  const sellValue = sells.reduce((sum, t) => sum + (t.value ?? 0), 0)

  return (
    <WidgetFrame
      title="Congressional Trades"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
    >
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Filings</div>
          <div className="font-medium">{trades.length}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Buys</div>
          <div className="font-medium text-[color:var(--color-bull)]">{buys.length}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Buy Value</div>
          <div className="font-medium text-[color:var(--color-bull)]">{fmtCompact(buyValue)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Sell Value</div>
          <div className="font-medium text-[color:var(--color-bear)]">{fmtCompact(sellValue)}</div>
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Member</th>
              <th className="py-1 font-medium">Type</th>
              <th className="py-1 font-medium text-right">Value</th>
              <th className="py-1 font-medium text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 25).map((t, i) => (
              <tr key={`${t.executedAt}-${i}`} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-1 text-muted-foreground">{t.executedAt.slice(0, 10)}</td>
                <td className="py-1 truncate max-w-[140px]" title={`${t.politicianName} (${t.chamber})`}>
                  {t.politicianName}
                </td>
                <td className="py-1 uppercase">{t.transactionType || "OTHER"}</td>
                <td className="py-1 text-right tabular-nums">{fmtCompact(t.value)}</td>
                <td className="py-1 text-right tabular-nums">{formatCurrency(t.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
