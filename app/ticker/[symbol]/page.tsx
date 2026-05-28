import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { EconomicCalendarWidget } from "@/components/economic-calendar-widget"
import { TickerHeader } from "@/components/ticker-header"
import { TickerChart } from "@/components/ticker-chart"
import { TickerTechnicals } from "@/components/ticker-technicals"
import { TickerPatterns } from "@/components/ticker-patterns"
import { TradeIdeaPanel } from "@/components/trade-idea-panel"
import { QuickTrade } from "@/components/quick-trade"
import { KeyMetricsDisplay } from "@/components/key-metrics-display"
import { TickerSupportResistance } from "@/components/ticker-support-resistance"
import { TickerCatalystsRisks } from "@/components/ticker-catalysts-risks"
import { EquityBlockTradesWidget } from "@/components/equity-block-trades-widget"
import { OptionsBlockTradesWidget } from "@/components/options-block-trades-widget"
import { VolatilityWidget } from "@/components/volatility-widget"
import { ShortInterestWidget } from "@/components/short-interest-widget"
import { EarningsHistoryWidget } from "@/components/earnings-history-widget"
import { FundamentalsWidget } from "@/components/fundamentals-widget"
import { AnalystRatingsWidget } from "@/components/analyst-ratings-widget"
import { InsiderActivityWidget } from "@/components/insider-activity-widget"
import { CongressionalTradesWidget } from "@/components/congressional-trades-widget"
import { EtfExposureWidget } from "@/components/etf-exposure-widget"
import { MarketInsiderWidget } from "@/components/market-insider-widget"
import { CryptoWhalesWidget } from "@/components/crypto-whales-widget"
import { OptionContractDrillDownWidget } from "@/components/option-contract-drill-down-widget"
import { GexWidget } from "@/components/gex-widget"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"
import { WidgetGroup } from "@/components/widget-group"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const layoutStorageKey = `analysis:grid:v20:${sym}`

  const widgets: Widget[] = [
    {
      id: "chart",
      title: "Price Chart",
      content: <TickerChart symbol={sym} className="h-full" />,
      defaultLayout: { x: 0, y: 0, w: 8, h: 14, minW: 4, minH: 8 },
    },
    {
      id: "flow-options",
      title: "Dark Pool, Options Chain & Blocks",
      content: (
        <WidgetGroup
          id="flow-options"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "dark-pool",
              title: "Dark Pool Blocks",
              content: <EquityBlockTradesWidget symbol={sym} />,
              availability: {
                url: `/api/uw/ticker/${sym}/dark-pool`,
                kind: "prints",
                reason: "Dark pool data is unavailable because Unusual Whales returned no block prints for this ticker in the current window.",
              },
              defaultOpen: true,
            },
            {
              id: "options-flow",
              title: "Options Blocks",
              content: <OptionsBlockTradesWidget symbol={sym} />,
              availability: {
                url: `/api/uw/ticker/${sym}/options-flow`,
                kind: "alerts",
                reason: "Options flow is unavailable because the live flow provider returned no alerts for this ticker.",
              },
              defaultOpen: true,
            },
            {
              id: "contract-drill-down",
              title: "Options Chain / Contract Drill-Down",
              content: <OptionContractDrillDownWidget symbol={sym} />,
              availability: {
                url: `/api/uw/ticker/${sym}/options-flow`,
                kind: "alerts",
                reason: "Options chain drill-down is unavailable until the options provider returns live contracts or flow alerts for this ticker.",
              },
              defaultOpen: false,
            },
          ]}
        />
      ),
      defaultLayout: { x: 0, y: 14, w: 8, h: 16, minW: 5, minH: 8 },
    },
    {
      id: "gamma-volatility",
      title: "Gamma & Volatility",
      content: (
        <WidgetGroup
          id="gamma-volatility"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "gamma",
              title: "Gamma / GEX / DEX",
              content: <GexWidget symbol={sym} />,
              availability: {
                url: `/api/fa/ticker/${sym}/gex`,
                kind: "data-object",
                reason: "Gamma is unavailable because FlashAlpha returned no GEX/DEX payload for this ticker.",
              },
              defaultOpen: true,
            },
            {
              id: "volatility",
              title: "Volatility IV/HV",
              content: <VolatilityWidget symbol={sym} />,
              availability: {
                url: `/api/uw/ticker/${sym}/volatility`,
                kind: "data-array",
                reason: "Volatility is unavailable because the IV/HV provider returned no history for this ticker.",
              },
              defaultOpen: true,
            },
          ]}
        />
      ),
      defaultLayout: { x: 0, y: 30, w: 8, h: 12, minW: 5, minH: 6 },
    },
    {
      id: "support-technicals",
      title: "Support / Resistance & Technicals",
      content: (
        <WidgetGroup
          id="support-technicals"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "support-resistance",
              title: "Support Levels",
              content: <TickerSupportResistance symbol={sym} />,
              defaultOpen: true,
            },
            {
              id: "technicals",
              title: "Technicals",
              content: <TickerTechnicals symbol={sym} />,
              defaultOpen: true,
            },
          ]}
        />
      ),
      defaultLayout: { x: 8, y: 0, w: 4, h: 16, minW: 3, minH: 8 },
    },
    {
      id: "fundamentals",
      title: "Fundamentals & Earnings",
      content: (
        <WidgetGroup
          id="fundamentals"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "fundamentals",
              title: "Fundamentals",
              content: <FundamentalsWidget symbol={sym} />,
              defaultOpen: false,
            },
            {
              id: "key-metrics",
              title: "Metrics",
              content: <KeyMetricsDisplay symbol={sym} />,
              defaultOpen: false,
            },
            {
              id: "earnings-history",
              title: "Earnings",
              content: <EarningsHistoryWidget symbol={sym} />,
              defaultOpen: false,
            },
            {
              id: "short-interest",
              title: "Short Interest",
              content: <ShortInterestWidget symbol={sym} />,
              defaultOpen: false,
            },
          ]}
        />
      ),
      defaultLayout: { x: 8, y: 16, w: 4, h: 10, minW: 3, minH: 6 },
    },
    {
      id: "earnings-calendar",
      title: "Earnings & Economic Calendar",
      content: (
        <WidgetGroup
          id="earnings-calendar"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "earnings-history",
              title: "Earnings",
              content: <EarningsHistoryWidget symbol={sym} />,
              defaultOpen: true,
            },
            {
              id: "economic-calendar",
              title: "Economic Calendar",
              content: <EconomicCalendarWidget />,
              availability: {
                url: "/api/uw/economic-calendar",
                kind: "data-array",
                reason: "Economic calendar is unavailable because the provider returned no upcoming events.",
              },
              defaultOpen: true,
            },
          ]}
        />
      ),
      defaultLayout: { x: 8, y: 26, w: 4, h: 10, minW: 3, minH: 6 },
    },
    {
      id: "catalysts-risks",
      title: "Catalysts & Risks",
      content: <TickerCatalystsRisks symbol={sym} />,
      defaultLayout: { x: 8, y: 38, w: 4, h: 8, minW: 3, minH: 6 },
    },
    {
      id: "execution",
      title: "Quick Trade & AI Setup",
      content: (
        <WidgetGroup
          id="execution"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "quick-trade",
              title: "Quick Trade",
              content: <QuickTrade initialSymbol={sym} />,
              defaultOpen: true,
            },
            {
              id: "trade-idea",
              title: "Trade Idea",
              content: <TradeIdeaPanel symbol={sym} />,
              defaultOpen: true,
            },
            {
              id: "patterns",
              title: "Chart Patterns",
              content: <TickerPatterns symbol={sym} />,
              defaultOpen: false,
            },
          ]}
        />
      ),
      defaultLayout: { x: 8, y: 46, w: 4, h: 10, minW: 3, minH: 6 },
    },
    {
      id: "research-intel",
      title: "Insider, Analyst & ETF Intelligence",
      content: (
        <WidgetGroup
          id="research-intel"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "analyst-ratings",
              title: "Analyst Reviews",
              content: <AnalystRatingsWidget symbol={sym} />,
              defaultOpen: true,
            },
            {
              id: "insider-activity",
              title: "Insider Activity",
              content: <InsiderActivityWidget symbol={sym} />,
              defaultOpen: false,
            },
            {
              id: "etf-exposure",
              title: "ETF Weighting",
              content: <EtfExposureWidget symbol={sym} />,
              defaultOpen: false,
            },
          ]}
        />
      ),
      defaultLayout: { x: 0, y: 32, w: 8, h: 14, minW: 5, minH: 6 },
    },
    {
      id: "smart-money",
      title: "Smart Money & Blockchain",
      content: (
        <WidgetGroup
          id="smart-money"
          storageKey={layoutStorageKey}
          items={[
            {
              id: "market-insider",
              title: "Market-Wide Insider Trades",
              content: <MarketInsiderWidget />,
              defaultOpen: true,
            },
            {
              id: "congressional-trades",
              title: "Congressional Trades",
              content: <CongressionalTradesWidget symbol={sym} />,
              availability: {
                url: `/api/ticker/${sym}/congressional-trades`,
                kind: "data-array",
                reason: "Congressional trades are unavailable because the provider returned no recent filings for this ticker.",
              },
              defaultOpen: true,
            },
            {
              id: "crypto-whales",
              title: "Crypto Whales",
              content: <CryptoWhalesWidget />,
              defaultOpen: false,
            },
          ]}
        />
      ),
      defaultLayout: { x: 0, y: 46, w: 8, h: 12, minW: 5, minH: 6 },
    },
  ]

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-2 pb-4 md:px-6">
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <TickerHeader symbol={sym} />

      {/* Webull-style tabbed widget grid — v14 forces new layout with all UW widgets */}
      <div className="mt-2">
        <AnalysisLayout widgets={widgets} storageKey={layoutStorageKey} />
      </div>
    </main>
  )
}
