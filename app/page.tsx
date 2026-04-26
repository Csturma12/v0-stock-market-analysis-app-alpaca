import { MarketStatusBadge } from "@/components/market-status-badge"
import { HomeAccountBar } from "@/components/home-account-bar"
import { HomeSectorPills } from "@/components/home-sector-pills"
import { HomeMarketNews } from "@/components/home-market-news"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Compact header */}
      <header className="shrink-0 border-b border-border/40 px-4 py-2">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Stock Market <span className="text-primary">Intelligence</span>
            </h1>
            <MarketStatusBadge />
          </div>
          <HomeAccountBar compact />
        </div>
      </header>

      {/* Top half — one wide box with 2-column sector+theme pills */}
      <section className="h-1/2 min-h-0 border-b border-border/40">
        <div className="mx-auto h-full max-w-[1600px] p-3">
          <HomeSectorPills />
        </div>
      </section>

      {/* Bottom half — market news scrollable box */}
      <section className="h-1/2 min-h-0">
        <div className="mx-auto h-full max-w-[1600px] p-3">
          <HomeMarketNews />
        </div>
      </section>
    </main>
  )
}
