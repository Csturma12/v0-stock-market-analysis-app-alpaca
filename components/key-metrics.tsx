import { cn } from "@/lib/utils"

type Metric = {
  label: string
  value: string
}

export function KeyMetrics({ metrics }: { metrics: Metric[] }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-background px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="font-mono text-sm font-medium tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
