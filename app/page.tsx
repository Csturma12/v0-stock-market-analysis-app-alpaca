import { SECTORS } from "@/lib/constants"
import { SectorGrid } from "@/components/sector-grid"
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
          Explore all 11 GICS sectors. Drill into sub-industries, trending tickers, news, sentiment, and AI-powered
          trade ideas backed by your own learning memory.
        </p>
      </header>

      <SectorGrid sectors={SECTORS} />
    </main>
  )
}
