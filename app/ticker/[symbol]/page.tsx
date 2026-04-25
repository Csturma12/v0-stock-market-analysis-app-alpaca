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

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  return (
    <main className="mx-auto max-w-7xl px-0.5 py-8 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <TickerHeader symbol={sym} />

      {/* Main two-column layout: left = content, right = sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT — main content column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <TickerChart symbol={sym} />
          <TickerDarkPool symbol={sym} />
          <TickerPatterns symbol={sym} />
          <TradeIdeaPanel symbol={sym} />
          <TickerNews symbol={sym} />
        </div>

        {/* RIGHT — sidebar */}
        <div className="flex flex-col gap-6 lg:self-start">
          <TickerAnalystRatings symbol={sym} />
          <KeyMetricsDisplay symbol={sym} />
          <TickerFundamentals symbol={sym} />
          <TickerTechnicals symbol={sym} />
          <TickerSupportResistance symbol={sym} />
          <TickerCatalystsRisks symbol={sym} />
        </div>

      </div>
    </main>
  )
}
