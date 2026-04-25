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
  // Layout matching user's preferred arrangement from screenshot
  // Default layout matches screenshot:
  // Row 1 (y=0,  h=11): Chart (cols 0-5) | Support+Resistance (cols 6-8) | Analyst Ratings (cols 9-11)
  //                      Chart continues  | Technicals         (cols 6-8) | Fundamentals     (cols 9-11)
  // Row 2 (y=11, h=6):  Dark Pool        (cols 0-4)           | Key Metrics (cols 4-8) | News (cols 8-11, spans rows 2-3)
  // Row 3 (y=17, h=7):  Trade Idea       (cols 0-4)           | Patterns    (cols 4-8) | News continued
  // Row 4 (y=24, h=6):  Catalysts        (cols 0-11)
  const widgets: Widget[] = [
    {
      id: "chart",
      title: "Chart",
      content: <TickerChart symbol={sym} className="h-full" />,
      defaultLayout: { x: 0, y: 0, w: 6, h: 11, minW: 4, minH: 8 },
    },
    {
      id: "support-resistance",
      title: "Key Support & Resistance",
      content: <TickerSupportResistance symbol={sym} />,
      defaultLayout: { x: 6, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
    },
    {
      id: "analyst-ratings",
      title: "Analyst Ratings",
      content: <TickerAnalystRatings symbol={sym} />,
      defaultLayout: { x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
    },
    {
      id: "technicals",
      title: "Technicals",
      content: <TickerTechnicals symbol={sym} />,
      defaultLayout: { x: 6, y: 6, w: 3, h: 5, minW: 2, minH: 4 },
    },
    {
      id: "fundamentals",
      title: "Fundamentals",
      content: <TickerFundamentals symbol={sym} />,
      defaultLayout: { x: 9, y: 6, w: 3, h: 5, minW: 2, minH: 4 },
    },
    {
      id: "dark-pool",
      title: "Dark Pool Activity",
      content: <TickerDarkPool symbol={sym} />,
      defaultLayout: { x: 0, y: 11, w: 5, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "key-metrics",
      title: "Key Metrics",
      content: <KeyMetricsDisplay symbol={sym} />,
      defaultLayout: { x: 5, y: 11, w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
      id: "news",
      title: "Top 10 Stories",
      content: <TickerNews symbol={sym} />,
      defaultLayout: { x: 9, y: 11, w: 3, h: 13, minW: 2, minH: 5 },
    },
    {
      id: "trade-idea",
      title: "AI Trade Idea",
      content: <TradeIdeaPanel symbol={sym} />,
      defaultLayout: { x: 0, y: 17, w: 5, h: 7, minW: 3, minH: 5 },
    },
    {
      id: "patterns",
      title: "Pattern Analysis",
      content: <TickerPatterns symbol={sym} />,
      defaultLayout: { x: 5, y: 17, w: 4, h: 7, minW: 3, minH: 4 },
    },
    {
      id: "catalysts",
      title: "Catalysts & Risks",
      content: <TickerCatalystsRisks symbol={sym} />,
      defaultLayout: { x: 0, y: 24, w: 9, h: 6, minW: 3, minH: 4 },
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
        <AnalysisLayout widgets={widgets} storageKey={`analysis:grid:v8:${sym}`} />
      </div>
    </main>
  )
}
