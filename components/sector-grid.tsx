"use client"

import Link from "next/link"
import useSWR from "swr"
import type { Sector } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { fmtPct } from "@/lib/format"
import { ArrowUpRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SectorPerf = { etf: string; price: number | null; change: number | null; changePct: number | null }

export function SectorGrid({ sectors }: { sectors: Sector[] }) {
  const { data } = useSWR<{ data: SectorPerf[] }>("/api/market/sectors", fetcher, {
    refreshInterval: 60_000,
  })

  const perfMap = new Map<string, SectorPerf>()
  for (const row of data?.data ?? []) perfMap.set(row.etf, row)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((s) => {
        const perf = perfMap.get(s.etf)
        const changePct = perf?.changePct ?? null
        const isUp = changePct != null && changePct >= 0
        const loading = !data

        return (
          <Link
            key={s.id}
            href={`/sector/${s.id}`}
            className="group relative flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.etf}</span>
                <h3 className="text-lg font-semibold leading-tight text-card-foreground">{s.name}</h3>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>

            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{s.description}</p>

            <div className="mt-auto flex items-end justify-between gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Day</span>
                <span
                  className={cn(
                    "font-mono text-xl font-semibold tabular-nums",
                    loading && "text-muted-foreground",
                    !loading && isUp && "text-[color:var(--color-bull)]",
                    !loading && !isUp && changePct != null && "text-[color:var(--color-bear)]",
                  )}
                >
                  {loading ? "—" : changePct == null ? "—" : fmtPct(changePct)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {s.subIndustries.length} groups
                </span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {perf?.price ? `$${perf.price.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
