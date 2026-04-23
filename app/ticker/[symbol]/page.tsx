import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TickerHeader } from "@/components/ticker-header"
import { TickerChart } from "@/components/ticker-chart"
import { TickerFundamentals } from "@/components/ticker-fundamentals"
import { TickerTechnicals } from "@/components/ticker-technicals"
import { TickerAnalystRatings } from "@/components/ticker-analyst-ratings"
import { TickerNews } from "@/components/ticker-news"
import { TickerDarkPool } from "@/components/ticker-dark-pool"
import { TradeIdeaPanel } from "@/components/trade-idea-panel"

export const dynamic = "force-dynamic"

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <TickerHeader symbol={sym} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TickerChart symbol={sym} />
        </div>
        <div>
          <TickerTechnicals symbol={sym} />
        </div>
      </div>

      <div className="mt-8">
        <TickerDarkPool symbol={sym} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradeIdeaPanel symbol={sym} />
        </div>
        <div>
          <TickerAnalystRatings symbol={sym} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TickerNews symbol={sym} />
        </div>
        <div>
          <TickerFundamentals symbol={sym} />
        </div>
      </div>
    </main>
  )
}
