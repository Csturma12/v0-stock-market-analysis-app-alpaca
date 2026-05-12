"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TradingAccount() {
  // Fetch Alpaca data
  const { data: alpacaData } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15_000 })
  const acc = alpacaData?.account

  // Fetch Webull data
  const { data: webullData, error: webullError } = useSWR("/api/webull/account", fetcher, { refreshInterval: 15_000 })
  const webull = webullData?.data?.balance ?? webullData?.balance

  // Alpaca calculations
  const alpacaEquity = Number(acc?.equity ?? 0)
  const alpacaLastEquity = Number(acc?.last_equity ?? 0)
  const alpacaDayPct = alpacaLastEquity ? ((alpacaEquity - alpacaLastEquity) / alpacaLastEquity) * 100 : 0
  const alpacaUp = alpacaDayPct >= 0

  // Webull calculations
  const webullEquity = webull?.net_liquidation ?? 0
  const webullCash = webull?.total_cash ?? 0
  const webullBP = webull?.buying_power ?? 0

  // Combined total
  const totalEquity = alpacaEquity + webullEquity

  // Check for Alpaca error
  const alpacaError = acc?.error || alpacaData?.error

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header with combined equity */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-base font-semibold">Trading Accounts</h3>
        <div className="text-right">
          <div className="font-mono text-lg font-bold tabular-nums">{fmt(totalEquity)}</div>
          <div className="font-mono text-[10px] uppercase text-muted-foreground">Combined Equity</div>
        </div>
      </div>

      <Tabs defaultValue="alpaca" className="p-4">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="alpaca" className="text-xs">
            Alpaca (Paper)
          </TabsTrigger>
          <TabsTrigger value="webull" className="text-xs">
            Webull (Live)
          </TabsTrigger>
        </TabsList>

        {/* Alpaca Tab */}
        <TabsContent value="alpaca">
          {alpacaError ? (
            <div className="rounded-lg border border-[color:var(--color-bear)]/40 bg-[color:var(--color-bear)]/10 p-4">
              <h4 className="mb-1 text-sm font-semibold">Alpaca not connected</h4>
              <p className="text-xs text-muted-foreground">
                Add ALPACA_API_KEY and ALPACA_SECRET_API_KEY as env vars.
                <br />
                <span className="text-[10px] text-muted-foreground/70">Error: {alpacaError}</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Cell label="Equity" value={fmt(alpacaEquity)} />
              <Cell
                label="Day P&L"
                value={`${alpacaUp ? "+" : ""}${alpacaDayPct.toFixed(2)}%`}
                color={alpacaUp ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"}
              />
              <Cell label="Cash" value={fmt(Number(acc?.cash ?? 0))} />
              <Cell label="Buying Power" value={fmt(Number(acc?.buying_power ?? 0))} />
            </div>
          )}
        </TabsContent>

        {/* Webull Tab */}
        <TabsContent value="webull">
          <WebullSection data={webullData} error={webullError} webull={webull} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WebullSection({ data, error, webull }: { data: any; error: any; webull: any }) {
  // Check for token pending verification
  const tokenStatus = data?.tokenStatus
  if (tokenStatus === "PENDING") {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <h4 className="mb-2 text-sm font-semibold">Webull Verification Required</h4>
        <p className="text-xs text-muted-foreground">
          Your Webull token is pending verification. Open the <strong>Webull App</strong> on your phone and complete the SMS/2FA verification to activate your API access.
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Once verified, refresh this page to see your account details.
        </p>
      </div>
    )
  }

  // Show error state if Webull not configured or API error
  if (error || data?.error) {
    const needsConfig = data?.needsConfig || data?.error?.includes("not configured")
    const isPending = data?.error?.includes("PENDING")
    
    if (isPending) {
      return (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <h4 className="mb-2 text-sm font-semibold">Webull Verification Required</h4>
          <p className="text-xs text-muted-foreground">
            Open the <strong>Webull App</strong> and complete SMS verification to activate API access.
          </p>
        </div>
      )
    }
    
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <h4 className="mb-2 text-sm font-semibold">
          {needsConfig ? "Webull Not Configured" : "Webull Connection Error"}
        </h4>
        <p className="text-xs text-muted-foreground">
          {needsConfig 
            ? "Add WEBULL_APP_KEY and WEBULL_APP_SECRET as environment variables to connect your Webull account."
            : `Error: ${data?.error || error?.message || "Failed to connect"}`}
        </p>
      </div>
    )
  }

  if (webull) {
    const webullEquity = webull?.net_liquidation ?? 0
    const webullCash = webull?.total_cash ?? 0
    const webullBP = webull?.buying_power ?? 0
    
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Cell label="Equity" value={fmt(webullEquity)} />
        <Cell label="Cash" value={fmt(webullCash)} />
        <Cell label="Buying Power" value={fmt(webullBP)} />
        <Cell label="Status" value="LIVE" color="text-green-500" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      Loading Webull account...
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-xl font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
