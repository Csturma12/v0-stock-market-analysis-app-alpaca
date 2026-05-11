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
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const widgets: Widget[] = [
    // Row 1: Chart + Support/Resistance + Technicals
    {
      id: "chart",
      title: "Chart",
      content: <TickerChart symbol={sym} className="h-full" />,
      defaultLayout: { x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    },
    {
      id: "support-resistance",
      title: "Key Support & Resistance",
      content: <TickerSupportResistance symbol={sym} />,
      defaultLayout: { x: 6, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
    },
    {
      id: "technicals",
      title: "Technicals",
      content: <TickerTechnicals symbol={sym} />,
      defaultLayout: { x: 6, y: 6, w: 3, h: 6, minW: 2, minH: 4 },
    },
    {
      id: "news",
      title: "Top 10 Stories",
      content: <TickerNews symbol={sym} />,
      defaultLayout: { x: 9, y: 0, w: 3, h: 12, minW: 2, minH: 5 },
    },

    // Row 2: Volatility, Short Interest, Earnings, Fundamentals
    {
      id: "volatility",
      title: "Volatility (IV vs HV)",
      content: <VolatilityWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 12, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "short-interest",
      title: "Short Interest",
      content: <ShortInterestWidget symbol={sym} />,
      defaultLayout: { x: 3, y: 12, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "earnings-history",
      title: "Earnings History",
      content: <EarningsHistoryWidget symbol={sym} />,
      defaultLayout: { x: 6, y: 12, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "fundamentals",
      title: "Fundamentals",
      content: <FundamentalsWidget symbol={sym} />,
      defaultLayout: { x: 9, y: 12, w: 3, h: 10, minW: 2, minH: 8 },
    },

    // Row 3: Analyst, Insider, ETF, Key Metrics
    {
      id: "analyst-ratings",
      title: "Analyst Ratings",
      content: <AnalystRatingsWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 22, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "insider-activity",
      title: "Insider Activity",
      content: <InsiderActivityWidget symbol={sym} />,
      defaultLayout: { x: 3, y: 22, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "etf-exposure",
      title: "ETF Exposure",
      content: <EtfExposureWidget symbol={sym} />,
      defaultLayout: { x: 6, y: 22, w: 3, h: 10, minW: 2, minH: 8 },
    },
    {
      id: "key-metrics",
      title: "Key Metrics",
      content: <KeyMetricsDisplay symbol={sym} />,
      defaultLayout: { x: 9, y: 22, w: 3, h: 5, minW: 2, minH: 3 },
    },

    // Row 4: Dark Pool + Options Flow (consolidated)
    {
      id: "equity-blocks",
      title: "Dark Pool & Block Trades",
      content: <EquityBlockTradesWidget symbol={sym} />,
      defaultLayout: { x: 0, y: 32, w: 6, h: 12, minW: 4, minH: 8 },
    },
    {
      id: "options-blocks",
      title: "Options Flow & Block Trades",
      content: <OptionsBlockTradesWidget symbol={sym} />,
      defaultLayout: { x: 6, y: 32, w: 6, h: 12, minW: 4, minH: 8 },
    },

    // Row 5: AI Trade Idea, Patterns, Catalysts
    {
      id: "trade-idea",
      title: "AI Trade Idea",
      content: <TradeIdeaPanel symbol={sym} />,
      defaultLayout: { x: 0, y: 44, w: 4, h: 8, minW: 2, minH: 5 },
    },
    {
      id: "patterns",
      title: "Pattern Analysis",
      content: <TickerPatterns symbol={sym} />,
      defaultLayout: { x: 4, y: 44, w: 4, h: 8, minW: 2, minH: 4 },
    },
    {
      id: "catalysts",
      title: "Catalysts & Risks",
      content: <TickerCatalystsRisks symbol={sym} />,
      defaultLayout: { x: 8, y: 44, w: 4, h: 8, minW: 2, minH: 4 },
    },

    // Row 6: Option Contract Drill-Down
    {
      id: "contract-drill-down",
      title: "Option Contract Drill-Down",
      content: <OptionContractDrillDownWidget />,
      defaultLayout: { x: 0, y: 52, w: 6, h: 10, minW: 4, minH: 8 },
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
        <AnalysisLayout widgets={widgets} storageKey={`analysis:grid:v15:${sym}`} />
      </div>
    </main>
  )
}
