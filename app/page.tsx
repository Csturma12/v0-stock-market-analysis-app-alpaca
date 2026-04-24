import { SECTORS } from "@/lib/constants"
import { THEMES } from "@/lib/themes"
import { SectorGrid } from "@/components/sector-grid"
import { ThemeGrid } from "@/components/theme-grid"
import { MarketStatusBadge } from "@/components/market-status-badge"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 flex flex-col gap-3 md:mb-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Stock Market / Sectors
          </span>
          <MarketStatusBadge />
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          US Stock Market Intelligence
        </h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Explore all 11 GICS sectors plus cross-cutting themes. Drill into sub-industries, trending tickers, news,
          sentiment, and AI-powered trade ideas backed by your own learning memory.
        </p>
      </header>

      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Themes</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Cross-sector · Event-driven
          </span>
        </div>
        <ThemeGrid themes={THEMES} />
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Sectors</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {SECTORS.length} GICS sectors
          </span>
        </div>
        <SectorGrid sectors={SECTORS} />
      </section>
    </main>
  )
}
