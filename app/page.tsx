import { SECTORS } from "@/lib/constants"
import { THEMES } from "@/lib/themes"
import { SectorGrid } from "@/components/sector-grid"
import { ThemeGrid } from "@/components/theme-grid"
import { MarketStatusBadge } from "@/components/market-status-badge"
import { HomeLivePositions } from "@/components/home-live-positions"
import { HomeEditableWatchlists } from "@/components/home-editable-watchlists"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">

      {/* Top header - smaller */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
            US Stock Market
          </h1>
          <MarketStatusBadge />
        </div>
      </header>

      {/* Main content - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* LEFT - Live Positions */}
        <div className="lg:col-span-1">
          <HomeLivePositions />
        </div>

        {/* RIGHT - Editable Watchlists */}
        <div className="lg:col-span-2">
          <HomeEditableWatchlists />
        </div>

      </div>

      {/* Themes section */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Themes</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Cross-sector · Event-driven
          </span>
        </div>
        <ThemeGrid themes={THEMES} />
      </section>

      {/* Sectors section */}
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
