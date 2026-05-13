"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"

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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AnalystRatingsWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"all" | "upgrades" | "downgrades">("all")
  const { data: consensusData } = useSWR<{ recommendations?: Consensus[] }>(`/api/ticker/${symbol}`, fetcher, {
    refreshInterval: 600_000,
  })
  const { data, isLoading, error } = useSWR<{ data: Rating[] }>(
    `/api/uw/ticker/${symbol}/analysts`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data?.data ?? []
  const consensus = consensusData?.recommendations?.[0]
  const filtered = tab === "all" ? rows : rows.filter((r) => r.action === (tab === "upgrades" ? "upgrade" : "downgrade"))
  
  // Stats
  const upgrades = rows.filter((r) => r.action === "upgrade").length
  const downgrades = rows.filter((r) => r.action === "downgrade").length
  const withPT = rows.filter((r) => r.priceTarget !== null)
  const avgPT = withPT.length > 0 ? withPT.reduce((a, r) => a + r.priceTarget!, 0) / withPT.length : null

  const actionColor = (action: Rating["action"]) => {
    if (action === "upgrade") return "text-green-500"
    if (action === "downgrade") return "text-red-500"
    if (action === "initiated") return "text-blue-500"
    return "text-muted-foreground"
  }

  const totalConsensus =
    consensus
      ? (consensus.strongBuy ?? 0) + (consensus.buy ?? 0) + (consensus.hold ?? 0) + (consensus.sell ?? 0) + (consensus.strongSell ?? 0)
      : 0

  return (
    <WidgetFrame
      title="Analyst Ratings"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
            <TabsTrigger value="upgrades" className="text-xs px-2 py-1">Up</TabsTrigger>
            <TabsTrigger value="downgrades" className="text-xs px-2 py-1">Down</TabsTrigger>
          </TabsList>
        </Tabs>
      }
      >
      {rows.length === 0 && consensus && (
        <div className="mb-3 rounded border border-border/50 bg-muted/30 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-muted-foreground">Consensus snapshot</span>
            <span className="font-mono text-[10px] text-muted-foreground">{consensus.period ?? "Latest"}</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            <ConsensusCell label="Strong Buy" value={consensus.strongBuy ?? 0} total={totalConsensus} />
            <ConsensusCell label="Buy" value={consensus.buy ?? 0} total={totalConsensus} />
            <ConsensusCell label="Hold" value={consensus.hold ?? 0} total={totalConsensus} />
            <ConsensusCell label="Sell" value={consensus.sell ?? 0} total={totalConsensus} />
            <ConsensusCell label="Strong Sell" value={consensus.strongSell ?? 0} total={totalConsensus} />
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Upgrades</div>
          <div className="font-medium text-green-500">{upgrades}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Downgrades</div>
          <div className="font-medium text-red-500">{downgrades}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Avg PT</div>
          <div className="font-medium">{avgPT ? formatCurrency(avgPT) : "—"}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-muted-foreground">Total</div>
          <div className="font-medium">{rows.length}</div>
        </div>
      </div>

      <div className="max-h-[250px] overflow-y-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Firm</th>
              <th className="py-1 font-medium">Action</th>
              <th className="py-1 font-medium text-right">PT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1">{r.date.slice(0, 10)}</td>
                <td className="py-1 truncate max-w-[100px]">{r.firm}</td>
                <td className={`py-1 capitalize ${actionColor(r.action)}`}>{r.action}</td>
                <td className="py-1 text-right">{r.priceTarget ? formatCurrency(r.priceTarget) : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No Unusual Whales analyst rows returned for this ticker right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}

function ConsensusCell({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="rounded bg-background/60 px-2 py-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-medium tabular-nums">{value}</div>
      <div className="font-mono text-[9px] text-muted-foreground">{pct}%</div>
    </div>
  )
}
