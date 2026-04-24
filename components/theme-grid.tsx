import Link from "next/link"
import type { Theme } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { ArrowUpRight, Sparkles, Scale } from "lucide-react"

const ACCENT_CLASSES: Record<Theme["accent"], string> = {
  primary: "border-primary/40 hover:border-primary hover:shadow-[0_0_0_1px_var(--primary)]",
  bull: "border-[color:var(--color-bull)]/40 hover:border-[color:var(--color-bull)]",
  bear: "border-[color:var(--color-bear)]/40 hover:border-[color:var(--color-bear)]",
  warning: "border-amber-400/40 hover:border-amber-400",
}

const ACCENT_ICON: Record<Theme["accent"], string> = {
  primary: "text-primary",
  bull: "text-[color:var(--color-bull)]",
  bear: "text-[color:var(--color-bear)]",
  warning: "text-amber-400",
}

function ThemeIcon({ id, className }: { id: string; className?: string }) {
  if (id === "ai-industry") return <Sparkles className={className} />
  if (id === "political-ma") return <Scale className={className} />
  return <Sparkles className={className} />
}

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {themes.map((t) => (
        <Link
          key={t.id}
          href={`/theme/${t.id}`}
          className={cn(
            "group relative flex flex-col gap-3 rounded-lg border bg-card p-5 transition-all hover:shadow-lg",
            ACCENT_CLASSES[t.accent],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ThemeIcon id={t.id} className={cn("h-5 w-5", ACCENT_ICON[t.accent])} />
              <h3 className="text-lg font-semibold leading-tight text-card-foreground">{t.name}</h3>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </div>

          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{t.description}</p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <span className={cn("font-mono text-xs uppercase tracking-widest", ACCENT_ICON[t.accent])}>
              {t.subtopics.length} topics · {t.tickers.length} tickers
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Theme</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
