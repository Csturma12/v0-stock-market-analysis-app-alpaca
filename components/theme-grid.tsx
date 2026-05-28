import React from "react"
import Link from "next/link"
import type { Theme } from "@/lib/themes"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Scale,
  Building2,
  ShoppingCart,
  Shield,
  Flame,
  Stethoscope,
  Landmark,
  Cpu,
} from "lucide-react"

const ACCENT_PILL: Record<Theme["accent"], string> = {
  primary: "border-primary/40 hover:border-primary text-primary",
  bull: "border-[color:var(--color-bull)]/40 hover:border-[color:var(--color-bull)] text-[color:var(--color-bull)]",
  bear: "border-[color:var(--color-bear)]/40 hover:border-[color:var(--color-bear)] text-[color:var(--color-bear)]",
  warning: "border-amber-400/40 hover:border-amber-400 text-amber-400",
}

const THEME_ICONS: Record<string, React.ElementType> = {
  "ai-industry": Sparkles,
  "ai-infrastructure": Cpu,
  "political-ma": Scale,
  "real-estate": Building2,
  "consumer-retail": ShoppingCart,
  "defense-government": Shield,
  "energy-industrials": Flame,
  "healthcare-biopharma": Stethoscope,
  "banking-finance": Landmark,
}

function ThemeIcon({ id, className }: { id: string; className?: string }) {
  const Icon = THEME_ICONS[id] ?? Sparkles
  return <Icon className={className} />
}

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((t) => (
        <Link
          key={t.id}
          href={`/theme/${t.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs transition-all hover:bg-muted/60",
            ACCENT_PILL[t.accent],
          )}
        >
          <ThemeIcon id={t.id} className="h-3 w-3 shrink-0" />
          <span className="font-medium text-card-foreground">{t.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{t.tickers.length}t</span>
        </Link>
      ))}
    </div>
  )
}
