"use client"

import { useEffect, useState } from "react"
import { KeyMetrics } from "./key-metrics"

type Metric = {
  label: string
  value: string
}

export function KeyMetricsDisplay({ symbol }: { symbol: string }) {
  const [metrics, setMetrics] = useState<Metric[] | null>(null)

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const res = await fetch("/api/trade-idea", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol }),
        })
        const data = await res.json()
        if (data.idea?.keyMetrics) {
          setMetrics(data.idea.keyMetrics)
        }
      } catch (e) {
        console.log("[v0] Failed to fetch metrics:", e)
      }
    }

    // Only fetch if symbol changed and we don't have metrics yet
    if (!metrics) {
      fetchIdea()
    }
  }, [symbol, metrics])

  return <KeyMetrics metrics={metrics ?? []} />
}
