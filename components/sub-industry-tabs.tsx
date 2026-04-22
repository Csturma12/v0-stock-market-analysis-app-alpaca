"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import type { Sector } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { fmtPct } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Snap = { ticker: string; price: number | null; changePct: number | null }

export function SubIndustryTabs({ sector }: { sector: Sector }) {
  const [active, setActive] = useState(sector.subIndustries[0].id)
  const current = sector.subIndustries.find((s) => s.id === active)!

  const { data } = useSWR<{ data: Snap[] }>(
    `/api/market/subindustry?tickers=${current.tickers.join(",")}`,
    fetcher,
    { refreshInterval: 60_000 },
  )
  const snapMap = new Map<string, Snap>()
  for (const s of data?.data ?? []) snapMap.set(s.ticker, s)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {sector.subIndustries.map((sub) => {
          const isActive = sub.id === active
          return (
            <button
              key={sub.id}
              onClick={() => setActive(sub.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {sub.name}
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-base font-semibold">{current.name}</h3>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {current.tickers.length} tickers
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {current.tickers.map((t) => {
            const snap = snapMap.get(t)
            const up = snap?.changePct != null && snap.changePct >= 0
            return (
              <Link
                key={t}
                href={`/ticker/${t}`}
                className="group flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <span className="font-mono text-sm font-semibold">{t}</span>
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    snap?.changePct == null && "text-muted-foreground",
                    snap?.changePct != null && up && "text-[color:var(--color-bull)]",
                    snap?.changePct != null && !up && "text-[color:var(--color-bear)]",
                  )}
                >
                  {snap?.changePct == null ? "—" : fmtPct(snap.changePct)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
