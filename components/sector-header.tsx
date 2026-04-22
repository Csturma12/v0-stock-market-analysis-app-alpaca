"use client"

import useSWR from "swr"
import type { Sector } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { fmtPct } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SectorHeader({ sector }: { sector: Sector }) {
  const { data } = useSWR<{ data: { etf: string; price: number; changePct: number }[] }>(
    "/api/market/sectors",
    fetcher,
    { refreshInterval: 60_000 },
  )
  const perf = data?.data.find((d) => d.etf === sector.etf)
  const changePct = perf?.changePct ?? null
  const isUp = changePct != null && changePct >= 0

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {sector.etf} · Sector
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{sector.name}</h1>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Day change</span>
          <span
            className={cn(
              "font-mono text-3xl font-semibold tabular-nums",
              changePct == null && "text-muted-foreground",
              changePct != null && isUp && "text-[color:var(--color-bull)]",
              changePct != null && !isUp && "text-[color:var(--color-bear)]",
            )}
          >
            {changePct == null ? "—" : fmtPct(changePct)}
          </span>
        </div>
      </div>
      <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">{sector.description}</p>
    </header>
  )
}
