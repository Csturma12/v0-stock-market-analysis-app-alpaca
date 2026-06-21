"use client"

import Link from "next/link"
import useSWR from "swr"
import type { Sector } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { fmtPct } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SectorPerf = { etf: string; price: number | null; change: number | null; changePct: number | null }

export function SectorGrid({ sectors }: { sectors: Sector[] }) {
  const { data } = useSWR<{ data: SectorPerf[] }>("/api/market/sectors", fetcher, {
    refreshInterval: 60_000,
  })

  const perfMap = new Map<string, SectorPerf>()
  for (const row of data?.data ?? []) perfMap.set(row.etf, row)

  return (
    <div className="flex flex-wrap gap-2">
      {sectors.map((s) => {
        const perf = perfMap.get(s.etf)
        const changePct = perf?.changePct ?? null
        const isUp = changePct != null && changePct >= 0
        const loading = !data

        return (
          <Link
            key={s.id}
            href={`/sector/${s.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-all hover:border-primary/60 hover:bg-muted/60"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.etf}</span>
            <span className="font-medium text-card-foreground">{s.name}</span>
            <span
              className={cn(
                "font-mono tabular-nums",
                loading && "text-muted-foreground",
                !loading && isUp && "text-[color:var(--color-bull)]",
                !loading && !isUp && changePct != null && "text-[color:var(--color-bear)]",
              )}
            >
              {loading ? "—" : changePct == null ? "—" : fmtPct(changePct)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
