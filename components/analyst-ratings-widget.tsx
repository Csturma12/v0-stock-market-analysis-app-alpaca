"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = { symbol: string }
type Rating = {
  date: string
  firm: string
  analyst: string | null
  rating: string
  priorRating: string | null
  priceTarget: number | null
  priorPriceTarget: number | null
  action: "upgrade" | "downgrade" | "initiated" | "reiterated" | "other"
}

type Consensus = {
  period?: string
  strongBuy?: number
  buy?: number
  hold?: number
  sell?: number
  strongSell?: number
}

type AnalystApiResponse = {
  data?: Rating[]
  consensus?: Consensus[]
  priceTarget?: { targetMean?: number | null; targetHigh?: number | null; targetLow?: number | null } | null
  source?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AnalystRatingsWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"all" | "upgrades" | "downgrades">("all")
  const { data: consensusData } = useSWR<{ recommendations?: Consensus[] }>(`/api/ticker/${symbol}`, fetcher, {
    refreshInterval: 600_000,
  })
  const { data, isLoading, error } = useSWR<AnalystApiResponse>(
    `/api/uw/ticker/${symbol}/analysts`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data?.data ?? []
  const consensus = consensusData?.recommendations?.[0]
  const filtered = tab === "all" ? rows : rows.filter((r) => r.action === (tab === "upgrades" ? "upgrade" : "downgrade"))

  const upgrades = rows.filter((r) => r.action === "upgrade").length
  const downgrades = rows.filter((r) => r.action === "downgrade").length
  const withPT = rows.filter((r) => r.priceTarget !== null)
  const avgPT = withPT.length > 0 ? withPT.reduce((a, r) => a + r.priceTarget!, 0) / withPT.length : null

  const totalConsensus =
    consensus
      ? (consensus.strongBuy ?? 0) + (consensus.buy ?? 0) + (consensus.hold ?? 0) + (consensus.sell ?? 0) + (consensus.strongSell ?? 0)
      : 0

  const actionColor = (action: Rating["action"]) => {
    if (action === "upgrade") return "text-green-500"
    if (action === "downgrade") return "text-red-500"
    if (action === "initiated") return "text-blue-500"
    return "text-muted-foreground"
  }

  return (
    <WidgetFrame
      title={`${symbol} Analyst Ratings`}
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="px-2 py-1 text-xs">All</TabsTrigger>
            <TabsTrigger value="upgrades" className="px-2 py-1 text-xs">Up</TabsTrigger>
            <TabsTrigger value="downgrades" className="px-2 py-1 text-xs">Down</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="flex items-center justify-between border-b border-border/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{symbol}</span>
        <span>{data?.source ?? "finnhub"}</span>
      </div>

      {rows.length === 0 && consensus && (
        <div className="border-b border-border/40 px-2 py-2">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Analyst Ratings</span>
            <span>{consensus.period ?? "Latest"}</span>
          </div>
          <div className="space-y-1.5">
            <ConsensusRow label="Strong Buy" value={consensus.strongBuy ?? 0} total={totalConsensus} fillClass="bg-green-500" />
            <ConsensusRow label="Buy" value={consensus.buy ?? 0} total={totalConsensus} fillClass="bg-emerald-500" />
            <ConsensusRow label="Hold" value={consensus.hold ?? 0} total={totalConsensus} fillClass="bg-amber-500" />
            <ConsensusRow label="Sell" value={consensus.sell ?? 0} total={totalConsensus} fillClass="bg-red-500" />
            <ConsensusRow label="Strong Sell" value={consensus.strongSell ?? 0} total={totalConsensus} fillClass="bg-rose-500" />
          </div>
        </div>
      )}

      {rows.length === 0 && !consensus && data?.priceTarget?.targetMean != null && (
        <div className="border-b border-border/40 px-2 py-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Price Target</span>
            <span>finnhub</span>
          </div>
          <div className="mt-1 font-mono text-sm font-semibold">{formatCurrency(data.priceTarget.targetMean)}</div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 px-2 py-2 text-xs">
        <MetricTile label="Upgrades" value={upgrades} tone="text-green-500" />
        <MetricTile label="Downgrades" value={downgrades} tone="text-red-500" />
        <MetricTile label="Avg PT" value={avgPT ? formatCurrency(avgPT) : "—"} />
        <MetricTile label="Total" value={rows.length} />
      </div>

      <div className="max-h-[250px] overflow-y-auto px-2 pb-2 text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Firm</th>
              <th className="py-1 font-medium">Action</th>
              <th className="py-1 font-medium text-right">PT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-1">{r.date.slice(0, 10)}</td>
                <td className="max-w-[110px] truncate py-1">{r.firm}</td>
                <td className={cn("py-1 capitalize", actionColor(r.action))}>{r.action}</td>
                <td className="py-1 text-right">{r.priceTarget ? formatCurrency(r.priceTarget) : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No analyst rows returned for this ticker right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}

function ConsensusRow({
  label,
  value,
  total,
  fillClass,
}: {
  label: string
  value: number
  total: number
  fillClass: string
}) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="grid grid-cols-[88px_1fr_28px] items-center gap-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-background/80">
        <div className={cn("h-full rounded-full", fillClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right font-mono text-[10px] tabular-nums">{value}</span>
    </div>
  )
}

function MetricTile({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded bg-muted/35 p-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-sm font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  )
}
