import { MarketStatusBadge } from "@/components/market-status-badge"
import { DualAccountWidget } from "@/components/dual-account-widget"
import { HomeSectorPills } from "@/components/home-sector-pills"
import { HomeWatchlistPills } from "@/components/home-watchlist-pills"
import { HomeHotStocks } from "@/components/home-hot-stocks"
import { HomeMarketChart } from "@/components/home-market-chart"
import { HomeMarketNews } from "@/components/home-market-news"
import { EconomicCalendarWidget } from "@/components/economic-calendar-widget"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const widgets: Widget[] = [
    {
      id: "accounts",
      title: "Account Snapshot",
      content: <DualAccountWidget compact />,
      defaultLayout: { x: 0, y: 0, w: 3, h: 7, minW: 3, minH: 5 },
    },
    {
      id: "market-update",
      title: "Market Update",
      content: <HomeMarketChart />,
      defaultLayout: { x: 3, y: 0, w: 6, h: 7, minW: 4, minH: 5 },
    },
    {
      id: "hot-stocks",
      title: "Hot Stocks",
      content: <HomeHotStocks />,
      defaultLayout: { x: 9, y: 0, w: 3, h: 12, minW: 3, minH: 6 },
    },
    {
      id: "watchlist",
      title: "Watchlist",
      content: <HomeWatchlistPills />,
      defaultLayout: { x: 0, y: 7, w: 5, h: 11, minW: 4, minH: 6 },
    },
    {
      id: "scanners",
      title: "Scanners",
      content: <HomeSectorPills />,
      defaultLayout: { x: 5, y: 7, w: 4, h: 11, minW: 3, minH: 8 },
    },
    {
      id: "economic-calendar",
      title: "Market Calendar",
      content: <EconomicCalendarWidget />,
      defaultLayout: { x: 9, y: 12, w: 3, h: 6, minW: 3, minH: 5 },
    },
    {
      id: "market-news",
      title: "Market News",
      content: <HomeMarketNews />,
      defaultLayout: { x: 0, y: 18, w: 12, h: 8, minW: 4, minH: 5 },
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Compact header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Stock Market <span className="text-primary">Intelligence</span>
          </h1>
          <MarketStatusBadge />
        </div>
      </header>

      {/* Adjustable widget grid */}
      <div className="mx-auto max-w-[1600px] px-4 py-3">
        <AnalysisLayout widgets={widgets} storageKey="home:grid:v19" defaultTemplate="market-search" />
      </div>
    </main>
  )
}
