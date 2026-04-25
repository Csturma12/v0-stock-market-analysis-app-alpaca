"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, ShieldCheck } from "lucide-react"

type Settings = {
  autonomous_enabled: boolean
  kill_switch: boolean
  max_position_usd: number
  max_daily_loss_usd: number
  min_conviction: number
}

export function TradingSettings() {
  const [s, setS] = useState<Settings>({
    autonomous_enabled: false,
    kill_switch: false,
    max_position_usd: 1000,
    max_daily_loss_usd: 500,
    min_conviction: 7,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/trading/settings")
      .then((r) => r.json())
      .then((d) => d.settings && setS(d.settings))
  }, [])

  async function save(next: Partial<Settings>) {
    const merged = { ...s, ...next }
    setS(merged)
    setSaving(true)
    await fetch("/api/trading/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(merged),
    })
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-end">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {saving ? "Saving…" : "Saved"}
        </span>
      </div>

      <button
        onClick={() => save({ kill_switch: !s.kill_switch })}
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors",
          s.kill_switch
            ? "border-[color:var(--color-bear)]/60 bg-[color:var(--color-bear)]/10 text-[color:var(--color-bear)]"
            : "border-border bg-background hover:border-primary/40",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          Kill Switch
        </span>
        <span className="font-mono text-xs uppercase tracking-widest">{s.kill_switch ? "ACTIVE" : "Off"}</span>
      </button>

      <button
        onClick={() => save({ autonomous_enabled: !s.autonomous_enabled })}
        disabled={s.kill_switch}
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors disabled:opacity-50",
          s.autonomous_enabled
            ? "border-[color:var(--color-bull)]/60 bg-[color:var(--color-bull)]/10 text-[color:var(--color-bull)]"
            : "border-border bg-background hover:border-primary/40",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Autonomous mode
        </span>
        <span className="font-mono text-xs uppercase tracking-widest">{s.autonomous_enabled ? "ARMED" : "Off"}</span>
      </button>

      <Field
        label="Max position ($)"
        value={s.max_position_usd}
        onChange={(v) => save({ max_position_usd: v })}
      />
      <Field
        label="Max daily loss ($)"
        value={s.max_daily_loss_usd}
        onChange={(v) => save({ max_daily_loss_usd: v })}
      />
      <Field
        label="Min conviction (1-10)"
        value={s.min_conviction}
        onChange={(v) => save({ min_conviction: v })}
        max={10}
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  max,
}: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-primary"
      />
    </label>
  )
}
