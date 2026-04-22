"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { fmtPct, fmtPrice } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerHeader({ symbol }: { symbol: string }) {
  const { data } = useSWR(`/api/ticker/${symbol}`, fetcher, { refreshInterval: 30_000 })
  const snap = data?.snapshot
  const profile = data?.profile
  const price = snap?.price ?? null
  const changePct = snap?.changePct ?? null
  const up = changePct != null && changePct >= 0

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {profile?.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.logo || "/placeholder.svg"} alt={`${symbol} logo`} className="h-10 w-10 rounded-md bg-card object-contain p-1" />
        )}
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {profile?.exchange ?? "—"} · {profile?.finnhubIndustry ?? "Stock"}
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {symbol} <span className="text-muted-foreground">· {profile?.name ?? ""}</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Price</span>
          <span className="font-mono text-3xl font-semibold tabular-nums">{fmtPrice(price)}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Day</span>
          <span
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums",
              changePct == null && "text-muted-foreground",
              changePct != null && up && "text-[color:var(--color-bull)]",
              changePct != null && !up && "text-[color:var(--color-bear)]",
            )}
          >
            {changePct == null ? "—" : fmtPct(changePct)}
          </span>
        </div>
        {profile?.marketCapitalization && (
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Mkt Cap</span>
            <span className="font-mono text-xl font-semibold tabular-nums">
              ${(profile.marketCapitalization / 1000).toFixed(2)}B
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
