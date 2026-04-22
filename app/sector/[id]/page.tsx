import Link from "next/link"
import { notFound } from "next/navigation"
import { SECTORS } from "@/lib/constants"
import { SubIndustryTabs } from "@/components/sub-industry-tabs"
import { TrendingTickers } from "@/components/trending-tickers"
import { NewsFeed } from "@/components/news-feed"
import { SectorHeader } from "@/components/sector-header"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sector = SECTORS.find((s) => s.id === id)
  if (!sector) notFound()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All sectors
      </Link>

      <SectorHeader sector={sector} />

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Sub-industries</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {sector.subIndustries.length} groups
          </span>
        </div>
        <SubIndustryTabs sector={sector} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Trending Tickers</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Live snapshot
          </span>
        </div>
        <TrendingTickers tickers={sector.trending} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">News, M&amp;A, Sentiment &amp; Analyst Moves</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Polygon + Finnhub + Tavily
          </span>
        </div>
        <NewsFeed sectorId={sector.id} tickers={sector.trending.slice(0, 8)} />
      </section>
    </main>
  )
}
