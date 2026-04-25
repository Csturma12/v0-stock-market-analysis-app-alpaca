import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TickerHeader } from "@/components/ticker-header"
import { TickerChart } from "@/components/ticker-chart"
import { TickerFundamentals } from "@/components/ticker-fundamentals"
import { TickerTechnicals } from "@/components/ticker-technicals"
import { TickerAnalystRatings } from "@/components/ticker-analyst-ratings"
import { TickerNews } from "@/components/ticker-news"
import { TickerDarkPool } from "@/components/ticker-dark-pool"
import { TickerPatterns } from "@/components/ticker-patterns"
import { TradeIdeaPanel } from "@/components/trade-idea-panel"
import { KeyMetricsDisplay } from "@/components/key-metrics-display"
import { TickerSupportResistance } from "@/components/ticker-support-resistance"
import { TickerCatalystsRisks } from "@/components/ticker-catalysts-risks"
import { AnalysisLayout } from "@/components/analysis-layout"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-4 md:px-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Ticker header */}
      <TickerHeader symbol={sym} />

      {/* Resizable, fit-to-screen analysis layout */}
      <div className="mt-4">
        <AnalysisLayout
          chart={<TickerChart symbol={sym} className="h-full" />}
          topSidebar={
            <>
              <TickerAnalystRatings symbol={sym} />
              <KeyMetricsDisplay symbol={sym} />
            </>
          }
          mainContent={
            <>
              <TickerDarkPool symbol={sym} />
              <TickerPatterns symbol={sym} />
              <TradeIdeaPanel symbol={sym} />
              <TickerNews symbol={sym} />
            </>
          }
          rightSidebar={
            <>
              <TickerFundamentals symbol={sym} />
              <TickerTechnicals symbol={sym} />
              <TickerSupportResistance symbol={sym} />
              <TickerCatalystsRisks symbol={sym} />
            </>
          }
        />
      </div>
    </main>
  )
}
