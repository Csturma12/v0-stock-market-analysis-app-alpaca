import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TradingAccount } from "@/components/trading-account"
import { TradingSettings } from "@/components/trading-settings"
import { TradingPositions } from "@/components/trading-positions"
import { TradingOrderForm } from "@/components/trading-order-form"

export const dynamic = "force-dynamic"

export default function TradingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Alpaca · Paper Trading
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Autonomous Trading Panel</h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Paper trading only until you flip the live switch. Guardrails (max position size, daily loss cap, conviction
          threshold, kill switch) apply to both manual and autonomous orders.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradingAccount />
        </div>
        <div>
          <TradingSettings />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradingPositions />
        </div>
        <div>
          <TradingOrderForm />
        </div>
      </div>
    </main>
  )
}
