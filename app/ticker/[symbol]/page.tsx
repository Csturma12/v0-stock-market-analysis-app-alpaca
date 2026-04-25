import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TickerHeader } from "@/components/ticker-header"
import { TickerChart } from "@/components/ticker-chart"
import { TickerFundamentals } from "@/components/ticker-fundamentals"
import { TickerTechnicals } from "@/components/ticker-technicals"
import { TickerAnalystRatings } from "@/components/ticker-analyst-ratings"
import { TickerDarkPool } from "@/components/ticker-dark-pool"
import { TickerPatterns } from "@/components/ticker-patterns"
import { TradeIdeaPanel } from "@/components/trade-idea-panel"
import { KeyMetricsDisplay } from "@/components/key-metrics-display"
import { TickerSupportResistance } from "@/components/ticker-support-resistance"
import { TickerCatalystsRisks } from "@/components/ticker-catalysts-risks"
import { TickerNews } from "@/components/ticker-news"
import { AnalysisLayout, type Widget } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  // Each widget is its own pill box, freely draggable + resizable on a 12-col grid.
  // Defaults below are the initial positions; users can rearrange and the layout
  // is persisted to localStorage.
  const widgets: Widget[] = [
    {
      id: "chart",
      title: "Chart",
      content: <TickerChart symbol={sym} className="h-full" />,
      defaultLayout: { x: 0, y: 0, w: 8, h: 14, minW: 4, minH: 8 },
    },
    {
      id: "analyst-ratings",
      title: "Analyst Ratings",
      content: <TickerAnalystRatings symbol={sym} />,
      defaultLayout: { x: 8, y: 0, w: 4, h: 7, minW: 3, minH: 4 },
    },
    {
      id: "key-metrics",
      title: "Key Metrics",
      content: <KeyMetricsDisplay symbol={sym} />,
      defaultLayout: { x: 8, y: 7, w: 4, h: 7, minW: 3, minH: 4 },
    },
    {
      id: "dark-pool",
      title: "Dark Pool",
      content: <TickerDarkPool symbol={sym} />,
      defaultLayout: { x: 0, y: 14, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "patterns",
      title: "Patterns",
      content: <TickerPatterns symbol={sym} />,
      defaultLayout: { x: 4, y: 14, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "trade-idea",
      title: "Trade Idea",
      content: <TradeIdeaPanel symbol={sym} />,
      defaultLayout: { x: 8, y: 14, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "fundamentals",
      title: "Fundamentals",
      content: <TickerFundamentals symbol={sym} />,
      defaultLayout: { x: 0, y: 20, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "technicals",
      title: "Technicals",
      content: <TickerTechnicals symbol={sym} />,
      defaultLayout: { x: 4, y: 20, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "support-resistance",
      title: "Support / Resistance",
      content: <TickerSupportResistance symbol={sym} />,
      defaultLayout: { x: 8, y: 20, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "catalysts",
      title: "Catalysts & Risks",
      content: <TickerCatalystsRisks symbol={sym} />,
      defaultLayout: { x: 0, y: 26, w: 6, h: 8, minW: 3, minH: 4 },
    },
    {
      id: "news",
      title: "News",
      content: <TickerNews symbol={sym} />,
      defaultLayout: { x: 6, y: 26, w: 6, h: 8, minW: 3, minH: 5 },
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

      {/* Compact header: ticker info + scrolling news */}
      <TickerHeader symbol={sym} />

      {/* Free-form draggable + resizable widget grid */}
      <div className="mt-2">
        <AnalysisLayout widgets={widgets} storageKey={`analysis:grid:v6:${sym}`} />
      </div>
    </main>
  )
}
