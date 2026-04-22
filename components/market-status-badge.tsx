"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export function MarketStatusBadge() {
  const { data } = useSWR<{ is_open: boolean }>("/api/market/clock", fetcher, { refreshInterval: 60_000 })
  const open = data?.is_open
  return (
    <Badge
      variant="outline"
      className={
        open
          ? "border-primary/40 bg-primary/10 text-primary font-mono text-xs"
          : "border-border text-muted-foreground font-mono text-xs"
      }
    >
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${open ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
      {open == null ? "—" : open ? "MARKET OPEN" : "MARKET CLOSED"}
    </Badge>
  )
}
