import { SECTORS } from "@/lib/constants"
import { THEMES } from "@/lib/themes"
import { SectorGrid } from "@/components/sector-grid"
import { ThemeGrid } from "@/components/theme-grid"
import { MarketStatusBadge } from "@/components/market-status-badge"
import { HomeLivePositions } from "@/components/home-live-positions"
import { HomeEditableWatchlists } from "@/components/home-editable-watchlists"
import { HomeStockPreview } from "@/components/home-stock-preview"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">

      {/* Top header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
            US Stock Market
          </h1>
          <MarketStatusBadge />
        </div>
      </header>

      {/* Row 1 — Positions + Chart Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <HomeLivePositions />
        </div>
        <div className="lg:col-span-2">
          <HomeStockPreview />
        </div>
      </div>

      {/* Row 2 — Watchlists */}
      <div className="mb-8">
        <HomeEditableWatchlists />
      </div>

      {/* Themes pills */}
      <section className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Themes</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cross-sector · Event-driven
          </span>
        </div>
        <ThemeGrid themes={THEMES} />
      </section>

      {/* Sectors pills */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sectors</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {SECTORS.length} GICS
          </span>
        </div>
        <SectorGrid sectors={SECTORS} />
      </section>
    </main>
  )
}
