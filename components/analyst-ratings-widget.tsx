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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AnalystRatingsWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"all" | "upgrades" | "downgrades">("all")
  const { data, isLoading, error } = useSWR<{ data: Rating[] }>(
    `/api/uw/ticker/${symbol}/analysts`,
    fetcher,
    { refreshInterval: 600_000 }
  )

  const rows = data?.data ?? []
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
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
