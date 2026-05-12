import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TickerHeader } from "@/components/ticker-header"
import { TickerChart } from "@/components/ticker-chart"
import { TickerTechnicals } from "@/components/ticker-technicals"
import { TickerPatterns } from "@/components/ticker-patterns"
import { TradeIdeaPanel } from "@/components/trade-idea-panel"
import { KeyMetricsDisplay } from "@/components/key-metrics-display"
import { TickerSupportResistance } from "@/components/ticker-support-resistance"
import { TickerCatalystsRisks } from "@/components/ticker-catalysts-risks"
import { TickerNews } from "@/components/ticker-news"
import { EquityBlockTradesWidget } from "@/components/equity-block-trades-widget"
import { OptionsBlockTradesWidget } from "@/components/options-block-trades-widget"
import { VolatilityWidget } from "@/components/volatility-widget"
import { ShortInterestWidget } from "@/components/short-interest-widget"
import { EarningsHistoryWidget } from "@/components/earnings-history-widget"
import { FundamentalsWidget } from "@/components/fundamentals-widget"
import { AnalystRatingsWidget } from "@/components/analyst-ratings-widget"
import { InsiderActivityWidget } from "@/components/insider-activity-widget"
import { EtfExposureWidget } from "@/components/etf-exposure-widget"
import { OptionContractDrillDownWidget } from "@/components/option-contract-drill-down-widget"
import { GexWidget } from "@/components/gex-widget"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const widgets: Widget[] = [
    // PRIMARY: Chart - always visible, largest widget
    {
      id: "chart",
      title: "Price Chart",
      content: <TickerChart symbol={sym} className="h-full" />,
      defaultLayout: { x: 0, y: 0, w: 8, h: 14, minW: 4, minH: 8 },
    },

    // TECHNICALS GROUP: Support/Resistance + Technicals (Day Trading, AI)
    {
      id: "technicals",
      title: "Technical Indicators",
      content: <TickerTechnicals symbol={sym} />,
      defaultLayout: { x: 8, y: 0, w: 4, h: 7, minW: 2, minH: 4 },
    },
    {
      id: "support-resistance",
      title: "Support & Resistance",
      content: <TickerSupportResistance symbol={sym} />,
      defaultLayout: { x: 8, y: 7, w: 4, h: 7, minW: 2, minH: 4 },
    },

    // OPTIONS GROUP: GEX, Volatility, Options Flow, Dark Pool
    {
      id: "gex",
      title: "GEX / DEX Levels",
      content: <GexWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 14, w: 4, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "volatility",
      title: "Volatility (IV/HV)",
      content: <VolatilityWidget symbol={sym} />,
      defaultLayout: { x: 4, y: 14, w: 4, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "options-blocks",
      title: "Options Flow",
      content: <OptionsBlockTradesWidget symbol={sym} />,
      defaultLayout: { x: 8, y: 14, w: 4, h: 10, minW: 3, minH: 8 },
    },
    {
      id: "equity-blocks",
      title: "Dark Pool Flow",
      content: <EquityBlockTradesWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 24, w: 6, h: 10, minW: 4, minH: 8 },
    },
    {
      id: "contract-drill-down",
      title: "Options Drill-Down",
      content: <OptionContractDrillDownWidget symbol={sym} />,
      defaultLayout: { x: 6, y: 24, w: 6, h: 10, minW: 4, minH: 8 },
    },

    // FUNDAMENTALS GROUP: Key Metrics, Fundamentals, Earnings
    {
      id: "key-metrics",
      title: "Key Metrics",
      content: <KeyMetricsDisplay symbol={sym} />,
      defaultLayout: { x: 0, y: 34, w: 3, h: 8, minW: 2, minH: 5 },
    },
    {
      id: "fundamentals",
      title: "Fundamentals",
      content: <FundamentalsWidget symbol={sym} />,
      defaultLayout: { x: 3, y: 34, w: 3, h: 8, minW: 2, minH: 6 },
    },
    {
      id: "earnings-history",
      title: "Earnings History",
      content: <EarningsHistoryWidget symbol={sym} />,
      defaultLayout: { x: 6, y: 34, w: 3, h: 8, minW: 2, minH: 6 },
    },
    {
      id: "short-interest",
      title: "Short Interest",
      content: <ShortInterestWidget symbol={sym} />,
      defaultLayout: { x: 9, y: 34, w: 3, h: 8, minW: 2, minH: 6 },
    },

    // RESEARCH GROUP: Analyst, Insider, ETF, News
    {
      id: "analyst-ratings",
      title: "Analyst Ratings",
      content: <AnalystRatingsWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 42, w: 4, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "insider-activity",
      title: "Insider Activity",
      content: <InsiderActivityWidget symbol={sym} />,
      defaultLayout: { x: 4, y: 42, w: 4, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "etf-exposure",
      title: "ETF Exposure",
      content: <EtfExposureWidget symbol={sym} />,
      defaultLayout: { x: 8, y: 42, w: 4, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "news",
      title: "Latest News",
      content: <TickerNews symbol={sym} />,
      defaultLayout: { x: 0, y: 52, w: 12, h: 8, minW: 4, minH: 5 },
    },

    // AI GROUP: Trade Ideas, Patterns, Catalysts
    {
      id: "trade-idea",
      title: "AI Trade Idea",
      content: <TradeIdeaPanel symbol={sym} />,
      defaultLayout: { x: 0, y: 60, w: 5, h: 10, minW: 3, minH: 6 },
    },
    {
      id: "patterns",
      title: "Chart Patterns",
      content: <TickerPatterns symbol={sym} />,
      defaultLayout: { x: 5, y: 60, w: 4, h: 10, minW: 2, minH: 5 },
    },
    {
      id: "catalysts",
      title: "Catalysts & Risks",
      content: <TickerCatalystsRisks symbol={sym} />,
      defaultLayout: { x: 9, y: 60, w: 3, h: 10, minW: 2, minH: 5 },
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
        <AnalysisLayout widgets={widgets} storageKey={`analysis:grid:v17:${sym}`} />
      </div>
    </main>
  )
}
