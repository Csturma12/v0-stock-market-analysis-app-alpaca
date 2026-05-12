import { MarketStatusBadge } from "@/components/market-status-badge"
import { DualAccountWidget } from "@/components/dual-account-widget"
import { HomeSectorPills } from "@/components/home-sector-pills"
import { HomeMarketNews } from "@/components/home-market-news"
import { QuickTradeIdea } from "@/components/quick-trade-idea"
import { QuickTrade } from "@/components/quick-trade"
import { EquityBlockTradesWidget } from "@/components/equity-block-trades-widget"
import { OptionsBlockTradesWidget } from "@/components/options-block-trades-widget"
import { GroupFlowWidget } from "@/components/group-flow-widget"
import { CorrelationsWidget } from "@/components/correlations-widget"
import { EconomicCalendarWidget } from "@/components/economic-calendar-widget"
import { CryptoWhalesWidget } from "@/components/crypto-whales-widget"
import { MarketInsiderWidget } from "@/components/market-insider-widget"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const widgets: Widget[] = [
    // ROW 1: Sectors/Themes/Commodities (top left)
    {
      id: "sectors-themes",
      title: "Sectors, Themes & Commodities",
      content: <HomeSectorPills />,
      defaultLayout: { x: 0, y: 0, w: 8, h: 14, minW: 6, minH: 10 },
    },
    // ROW 1: Trading Accounts (top right)
    {
      id: "accounts",
      title: "Trading Accounts",
      content: <DualAccountWidget />,
      defaultLayout: { x: 8, y: 0, w: 4, h: 14, minW: 3, minH: 8 },
    },
    // ROW 2: Flow widgets
    {
      id: "equity-blocks",
      title: "Dark Pool Flow",
      content: <EquityBlockTradesWidget />,
      defaultLayout: { x: 0, y: 14, w: 6, h: 12, minW: 4, minH: 8 },
    },
    {
      id: "options-blocks",
      title: "Options Flow",
      content: <OptionsBlockTradesWidget />,
      defaultLayout: { x: 6, y: 14, w: 6, h: 12, minW: 4, minH: 8 },
    },
    // ROW 3: Quick actions + Sector Flow
    {
      id: "quick-trade",
      title: "Quick Trade Idea",
      content: <QuickTradeIdea />,
      defaultLayout: { x: 0, y: 26, w: 3, h: 8, minW: 2, minH: 5 },
    },
    {
      id: "quick-order",
      title: "Quick Trade",
      content: <QuickTrade />,
      defaultLayout: { x: 3, y: 26, w: 3, h: 8, minW: 2, minH: 5 },
    },
    {
      id: "group-flow",
      title: "Sector/ETF Flow",
      content: <GroupFlowWidget />,
      defaultLayout: { x: 6, y: 26, w: 6, h: 8, minW: 4, minH: 6 },
    },
    // ROW 4: Correlations + Calendar
    {
      id: "correlations",
      title: "Asset Correlations",
      content: <CorrelationsWidget />,
      defaultLayout: { x: 0, y: 34, w: 6, h: 10, minW: 4, minH: 8 },
    },
    {
      id: "economic-calendar",
      title: "Economic Calendar",
      content: <EconomicCalendarWidget />,
      defaultLayout: { x: 6, y: 34, w: 6, h: 10, minW: 4, minH: 6 },
    },
    // ROW 5: Crypto + Insider
    {
      id: "crypto-whales",
      title: "Crypto Whales",
      content: <CryptoWhalesWidget />,
      defaultLayout: { x: 0, y: 44, w: 6, h: 10, minW: 4, minH: 6 },
    },
    {
      id: "market-insider",
      title: "Market Insider Trades",
      content: <MarketInsiderWidget />,
      defaultLayout: { x: 6, y: 44, w: 6, h: 10, minW: 4, minH: 6 },
    },
    // ROW 6: News (full width)
    {
      id: "market-news",
      title: "Market News",
      content: <HomeMarketNews />,
      defaultLayout: { x: 0, y: 54, w: 12, h: 10, minW: 4, minH: 5 },
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
        <AnalysisLayout widgets={widgets} storageKey="home:grid:v17" />
      </div>
    </main>
  )
}
