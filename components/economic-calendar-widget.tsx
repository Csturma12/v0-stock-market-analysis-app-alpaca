"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Calendar, Clock } from "lucide-react"

type Event = {
  date: string
  time: string
  event: string
  country: string
  importance: "low" | "medium" | "high"
  actual?: string
  forecast?: string
  previous?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EconomicCalendarWidget() {
  const [filter, setFilter] = useState<"all" | "high">("all")
  const { data, isLoading, error } = useSWR<{ data: Event[] }>(
    "/api/uw/economic-calendar",
    fetcher,
    { refreshInterval: 300_000 }
  )

  const allEvents = data?.data ?? []
  const events = filter === "high" ? allEvents.filter((e) => e.importance === "high") : allEvents

  function importanceColor(imp: string): string {
    if (imp === "high") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (imp === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    return "bg-muted/50 text-muted-foreground border-border/50"
  }

  // Group by date
  const grouped: Record<string, Event[]> = {}
  for (const e of events) {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date].push(e)
  }
  const dates = Object.keys(grouped).sort()

  return (
    <WidgetFrame
      title="Economic Calendar"
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
            <TabsTrigger value="high" className="text-xs px-2 py-1">High Impact</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="max-h-[300px] overflow-y-auto space-y-3 text-xs">
        {dates.length === 0 && <p className="text-muted-foreground text-center py-4">No events</p>}
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">{date}</span>
            </div>
            <div className="space-y-1 pl-5">
              {grouped[date].map((e, i) => (
                <div key={i} className={cn("rounded border p-2", importanceColor(e.importance))}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium leading-tight">{e.event}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {e.time} &middot; {e.country}
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                      e.importance === "high" ? "bg-red-500/30" : e.importance === "medium" ? "bg-amber-500/30" : "bg-muted"
                    )}>
                      {e.importance}
                    </span>
                  </div>
                  {(e.forecast || e.previous) && (
                    <div className="flex gap-3 mt-1 text-[10px]">
                      {e.actual && <span>Actual: <strong>{e.actual}</strong></span>}
                      {e.forecast && <span>Forecast: {e.forecast}</span>}
                      {e.previous && <span>Previous: {e.previous}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WidgetFrame>
  )
}
