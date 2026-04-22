import Link from "next/link"
import { Activity, LineChart, TrendingUp } from "lucide-react"
import { MarketStatusBadge } from "./market-status-badge"

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <Activity className="h-4 w-4 text-primary" />
          <span>MARKET INTEL</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5" />
              Sectors
            </span>
          </Link>
          <Link
            href="/trading"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Trading
            </span>
          </Link>
        </nav>
        <div className="ml-auto">
          <MarketStatusBadge />
        </div>
      </div>
    </header>
  )
}
