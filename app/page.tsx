import { MarketStatusBadge } from "@/components/market-status-badge"
import { HomeAccountBar } from "@/components/home-account-bar"
import { HomeSectorPills } from "@/components/home-sector-pills"
import { HomeMarketNews } from "@/components/home-market-news"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Compact header */}
      <header className="shrink-0 border-b border-border/40 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Stock Market <span className="text-primary">Intelligence</span>
            </h1>
            <MarketStatusBadge />
          </div>
          <HomeAccountBar compact />
        </div>
      </header>

      {/* Top half — two large sector pill boxes */}
      <section className="flex-1 min-h-0 border-b border-border/40">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-3 p-4 md:grid-cols-2">
          {/* Left box — first 6 sectors */}
          <div className="flex flex-col rounded-lg border border-border/50 bg-card/30 overflow-hidden">
            <div className="shrink-0 border-b border-border/40 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Sectors 1–6 · Top 10 by Conviction
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <HomeSectorPills column={0} />
            </div>
          </div>

          {/* Right box — last 5 sectors */}
          <div className="flex flex-col rounded-lg border border-border/50 bg-card/30 overflow-hidden">
            <div className="shrink-0 border-b border-border/40 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Sectors 7–11 · Top 10 by Conviction
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <HomeSectorPills column={1} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom half — market news scrollable box */}
      <section className="flex-1 min-h-0">
        <div className="mx-auto h-full max-w-7xl p-4">
          <HomeMarketNews />
        </div>
      </section>
    </main>
  )
}
