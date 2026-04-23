"use client"

import useSWR from "swr"
import { fmtUsd, fmtCompact } from "@/lib/format"
import { Activity, TrendingDown, TrendingUp } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type UWSummary = {
  darkPool: {
    prints: {
      executedAt: string
      price: number
      size: number
      premium: number
      marketCenter?: string
    }[]
    totalPremium: number
    totalSize: number
    largestPrint: { price: number; size: number; premium: number; executedAt: string } | null
  }
  flow: {
    alerts: {
      createdAt: string
      type: "call" | "put"
      strike: number
      expiry: string
      premium: number
      sentiment: "bullish" | "bearish" | "neutral"
    }[]
    callPremium: number
    putPremium: number
    callPutRatio: number
    bullishCount: number
    bearishCount: number
  }
}

export function TickerDarkPool({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ uw: UWSummary | null }>(`/api/ticker/${symbol}/flow`, fetcher, {
    refreshInterval: 60_000,
  })

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
  }

  if (!data?.uw) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold">Dark Pool & Options Flow</h3>
        <p className="text-xs text-muted-foreground">
          Unusual Whales data unavailable. Check your API key or the ticker may not have recent flow.
        </p>
      </div>
    )
  }

  const { darkPool, flow } = data.uw
  const netFlow = flow.callPremium - flow.putPremium
  const netBias = netFlow > 0 ? "Bullish" : netFlow < 0 ? "Bearish" : "Neutral"

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Dark Pool Activity
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Unusual Whales</span>
        </div>

        <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
          <div>
            <div className="text-xs text-muted-foreground">Total Premium</div>
            <div className="text-lg font-semibold text-foreground">{fmtUsd(darkPool.totalPremium)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Size</div>
            <div className="text-lg font-semibold text-foreground">{fmtCompact(darkPool.totalSize)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Largest Print</div>
            <div className="text-lg font-semibold text-foreground">
              {darkPool.largestPrint ? fmtUsd(darkPool.largestPrint.premium) : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Recent Prints</div>
          {darkPool.prints.length === 0 ? (
            <p className="text-xs text-muted-foreground">No dark pool prints in the last session.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 text-right font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {darkPool.prints.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="py-1.5 text-muted-foreground">
                        {new Date(p.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-1.5 font-mono text-foreground">${p.price.toFixed(2)}</td>
                      <td className="py-1.5 font-mono text-foreground">{fmtCompact(p.size)}</td>
                      <td className="py-1.5 text-right font-mono font-medium text-foreground">
                        {fmtUsd(p.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {netFlow >= 0 ? (
              <TrendingUp className="h-4 w-4" style={{ color: "var(--color-bull)" }} />
            ) : (
              <TrendingDown className="h-4 w-4" style={{ color: "var(--color-bear)" }} />
            )}
            Options Flow — <span style={{ color: netFlow >= 0 ? "var(--color-bull)" : "var(--color-bear)" }}>{netBias}</span>
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Unusual Whales</span>
        </div>

        <div className="grid grid-cols-4 gap-4 border-b border-border pb-4">
          <div>
            <div className="text-xs text-muted-foreground">Call Premium</div>
            <div className="text-base font-semibold" style={{ color: "var(--color-bull)" }}>
              {fmtUsd(flow.callPremium)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Put Premium</div>
            <div className="text-base font-semibold" style={{ color: "var(--color-bear)" }}>
              {fmtUsd(flow.putPremium)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">C/P Ratio</div>
            <div className="text-base font-semibold text-foreground">
              {Number.isFinite(flow.callPutRatio) ? flow.callPutRatio.toFixed(2) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bull / Bear</div>
            <div className="text-base font-semibold text-foreground">
              <span style={{ color: "var(--color-bull)" }}>{flow.bullishCount}</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span style={{ color: "var(--color-bear)" }}>{flow.bearishCount}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Recent Alerts</div>
          {flow.alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No flow alerts in the last session.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Strike</th>
                    <th className="pb-2 font-medium">Expiry</th>
                    <th className="pb-2 text-right font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {flow.alerts.slice(0, 10).map((a, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="py-1.5 text-muted-foreground">
                        {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-1.5 font-medium uppercase">
                        <span
                          style={{
                            color:
                              a.sentiment === "bullish"
                                ? "var(--color-bull)"
                                : a.sentiment === "bearish"
                                  ? "var(--color-bear)"
                                  : undefined,
                          }}
                        >
                          {a.type}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-foreground">${a.strike}</td>
                      <td className="py-1.5 font-mono text-muted-foreground">{a.expiry}</td>
                      <td className="py-1.5 text-right font-mono font-medium text-foreground">
                        {fmtUsd(a.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
