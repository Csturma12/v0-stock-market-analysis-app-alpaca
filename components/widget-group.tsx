"use client"

import { useEffect, useState, type ReactNode } from "react"
import useSWR from "swr"
import { AlertTriangle, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { jsonFetcher, useDelayedKey, useDelayedReady, WIDGET_STAGGER_MS } from "@/lib/widget-data"

type AvailabilityKind = "data-object" | "data-array" | "alerts" | "prints" | "snapshot"

export type WidgetGroupItem = {
  id: string
  title: string
  content: ReactNode
  availability?: {
    url: string
    kind: AvailabilityKind
    reason: string
  }
  defaultOpen?: boolean
}

type WidgetGroupProps = {
  id: string
  items: WidgetGroupItem[]
  storageKey: string
}

function hasLiveData(payload: unknown, kind: AvailabilityKind) {
  const data = payload as Record<string, any> | null | undefined
  if (!data) return false

  if (kind === "data-object") {
    return Boolean(data.data && typeof data.data === "object" && !Array.isArray(data.data))
  }
  if (kind === "data-array") {
    return Array.isArray(data.data) && data.data.length > 0
  }
  if (kind === "alerts") {
    return (Array.isArray(data.alerts) && data.alerts.length > 0) || (Array.isArray(data.data?.alerts) && data.data.alerts.length > 0)
  }
  if (kind === "prints") {
    return (Array.isArray(data.prints) && data.prints.length > 0) || (Array.isArray(data.data?.prints) && data.data.prints.length > 0)
  }
  if (kind === "snapshot") {
    return Boolean(data.snapshot || data.data?.snapshot || data.symbol || data.data?.symbol)
  }

  return false
}

function WidgetGroupSection({
  item,
  index,
  open,
  onToggle,
}: {
  item: WidgetGroupItem
  index: number
  open: boolean
  onToggle: () => void
}) {
  const delayMs = index * WIDGET_STAGGER_MS
  const availabilityKey = useDelayedKey(item.availability?.url ?? null, delayMs)
  const contentReady = useDelayedReady(open ? delayMs + 80 : 0)
  const { data, isLoading, error } = useSWR(availabilityKey, jsonFetcher, {
    dedupingInterval: 45_000,
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  const hasGate = Boolean(item.availability)
  const available = !hasGate || (!error && hasLiveData(data, item.availability!.kind))
  const unavailable = hasGate && !isLoading && !available

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border transition-colors",
        available ? "border-border/60 bg-background/35" : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={unavailable}
        className={cn(
          "flex h-9 w-full items-center gap-2 px-2 text-left transition-colors",
          available ? "hover:bg-muted/40" : "cursor-not-allowed",
        )}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
          {item.title}
        </span>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {unavailable && (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-300">
            Unavailable
          </span>
        )}
      </button>

      {unavailable && (
        <div className="flex gap-2 border-t border-amber-500/20 px-2 py-2 text-[11px] leading-4 text-amber-100/80">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>{item.availability?.reason}</span>
        </div>
      )}

      {open && available && (
        <div className="min-h-[220px] border-t border-border/30">
          {contentReady ? item.content : (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-muted-foreground">
              Loading {item.title.toLowerCase()}...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function WidgetGroup({ id, items, storageKey }: WidgetGroupProps) {
  const groupKey = `${storageKey}:group:${id}:open`
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.defaultOpen ?? true).map((item) => item.id)),
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(groupKey)
      if (raw) setOpenItems(new Set(JSON.parse(raw)))
    } catch {
      /* ignore */
    }
  }, [groupKey])

  function toggleItem(itemId: string) {
    const next = new Set(openItems)
    if (next.has(itemId)) {
      next.delete(itemId)
    } else {
      next.add(itemId)
    }
    setOpenItems(next)
    try {
      localStorage.setItem(groupKey, JSON.stringify([...next]))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto p-1.5">
      {items.map((item, index) => (
        <WidgetGroupSection
          key={item.id}
          item={item}
          index={index}
          open={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  )
}
