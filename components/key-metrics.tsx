import { cn } from "@/lib/utils"

type Metric = {
  label: string
  value: string
}

export function KeyMetrics({ metrics }: { metrics: Metric[] }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="key-metrics-container flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/40 px-2 py-0.5">
        <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Metrics</span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-0 bg-border/30 overflow-hidden">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col justify-center gap-0.5 bg-card px-1.5 py-1.5"
          >
            <span className="font-mono text-[8px] leading-none text-muted-foreground/70">{m.label}</span>
            <span className="font-mono text-[10px] font-semibold tabular-nums leading-tight text-foreground">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
