import { MarketStatusBadge } from "@/components/market-status-badge"
import { HomeAccountBar } from "@/components/home-account-bar"
import { HomeSectorPills } from "@/components/home-sector-pills"
import { HomeMarketNews } from "@/components/home-market-news"
import { QuickTradeIdea } from "@/components/quick-trade-idea"
import { QuickTrade } from "@/components/quick-trade"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default function HomePage() {
  // Define widgets with default positions on 12-col grid, rowHeight=40px
  // Account Overview: top right (3 cols wide, 5 rows = 200px)
  // Sectors & Themes: top left spanning most of width (9 cols, 12 rows = 480px)
  // Market News: bottom half spanning full width (12 cols, 10 rows = 400px)
  const widgets: Widget[] = [
    {
      id: "sectors-themes",
      title: "Sectors & Themes",
      content: <HomeSectorPills />,
      defaultLayout: { x: 0, y: 0, w: 9, h: 12, minW: 4, minH: 6 },
    },
    {
      id: "account",
      title: "Account Overview",
      content: <HomeAccountBar />,
      defaultLayout: { x: 9, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    },
    {
      id: "quick-trade",
      title: "Quick Trade Idea",
      content: <QuickTradeIdea />,
      defaultLayout: { x: 9, y: 5, w: 3, h: 6, minW: 2, minH: 5 },
    },
    {
      id: "quick-order",
      title: "Quick Trade",
      content: <QuickTrade />,
      defaultLayout: { x: 9, y: 11, w: 3, h: 7, minW: 2, minH: 6 },
    },
    {
      id: "market-news",
      title: "Market News",
      content: <HomeMarketNews />,
      defaultLayout: { x: 0, y: 12, w: 12, h: 10, minW: 4, minH: 5 },
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
        <AnalysisLayout widgets={widgets} storageKey="home:grid:v4" />
      </div>
    </main>
  )
}
