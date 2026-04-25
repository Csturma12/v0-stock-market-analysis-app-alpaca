"use client"

import { useState, useEffect } from "react"
import { Zap, AlertTriangle } from "lucide-react"

type IdeaData = {
  catalysts?: string[]
  risks?: string[]
}

export function TickerCatalystsRisks({ symbol }: { symbol: string }) {
  const [data, setData] = useState<IdeaData | null>(null)

  useEffect(() => {
    // Listen for the trade idea to be generated so we don't double-fetch
    const handler = (e: CustomEvent<IdeaData>) => setData(e.detail)
    window.addEventListener("trade-idea-ready" as any, handler)

    // Also attempt a passive fetch in case the idea already ran
    fetch("/api/trade-idea", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ symbol }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.idea) setData({ catalysts: json.idea.catalysts, risks: json.idea.risks })
      })
      .catch(() => {})

    return () => window.removeEventListener("trade-idea-ready" as any, handler)
  }, [symbol])

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <PillBlock
          title="Catalysts"
          icon={<Zap className="h-3.5 w-3.5" />}
          color="bull"
          items={[]}
          loading
        />
        <PillBlock
          title="Risks"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          color="bear"
          items={[]}
          loading
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PillBlock
        title="Catalysts"
        icon={<Zap className="h-3.5 w-3.5" />}
        color="bull"
        items={data.catalysts ?? []}
      />
      <PillBlock
        title="Risks"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        color="bear"
        items={data.risks ?? []}
      />
    </div>
  )
}

function PillBlock({
  title,
  icon,
  color,
  items,
  loading,
}: {
  title: string
  icon: React.ReactNode
  color: "bull" | "bear"
  items: string[]
  loading?: boolean
}) {
  const isBull = color === "bull"
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={isBull ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"}>
          {icon}
        </span>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Generate a trade idea to see {title.toLowerCase()}.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className={
                isBull
                  ? "rounded-full border border-[color:var(--color-bull)]/30 bg-[color:var(--color-bull)]/10 px-3 py-1 text-xs leading-relaxed text-[color:var(--color-bull)]"
                  : "rounded-full border border-[color:var(--color-bear)]/30 bg-[color:var(--color-bear)]/10 px-3 py-1 text-xs leading-relaxed text-[color:var(--color-bear)]"
              }
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
