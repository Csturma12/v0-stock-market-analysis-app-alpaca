"use client"

import Link from "next/link"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice, fmtVolume } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = {
  ticker: string
  price: number | null
  change: number | null
  changePct: number | null
  volume: number | null
  name?: string
}

export function TrendingTickers({ tickers }: { tickers: string[] }) {
  const { data } = useSWR<{ data: Snap[] }>(
    `/api/market/subindustry?tickers=${tickers.join(",")}`,
    fetcher,
    { refreshInterval: 30_000 },
  )
  const map = new Map<string, Snap>()
  for (const s of data?.data ?? []) map.set(s.ticker, s)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/40">
          <tr className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-2.5 text-left">Ticker</th>
            <th className="px-4 py-2.5 text-right">Price</th>
            <th className="px-4 py-2.5 text-right">Change</th>
            <th className="px-4 py-2.5 text-right">% Day</th>
            <th className="hidden px-4 py-2.5 text-right md:table-cell">Volume</th>
            <th className="px-4 py-2.5 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {tickers.map((t) => {
            const s = map.get(t)
            const up = s?.changePct != null && s.changePct >= 0
            return (
              <tr key={t} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="px-4 py-3">
                  <Link href={`/ticker/${t}`} className="font-mono text-sm font-semibold hover:text-primary">
                    {t}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{fmtPrice(s?.price)}</td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-sm tabular-nums",
                    s?.change == null && "text-muted-foreground",
                    s?.change != null && up && "text-[color:var(--color-bull)]",
                    s?.change != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {s?.change == null ? "—" : `${up ? "+" : ""}${s.change.toFixed(2)}`}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-sm tabular-nums",
                    s?.changePct == null && "text-muted-foreground",
                    s?.changePct != null && up && "text-[color:var(--color-bull)]",
                    s?.changePct != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {s?.changePct == null ? "—" : fmtPct(s.changePct)}
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground md:table-cell">
                  {fmtVolume(s?.volume)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/ticker/${t}`}
                    className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
                  >
                    Analyze
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
