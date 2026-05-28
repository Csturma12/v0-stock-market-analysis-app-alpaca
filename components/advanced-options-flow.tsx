"use client"

import { useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import type { TradierFlowSummary } from "@/lib/tradier-unusual-activity"
import type { FAFullMetrics } from "@/lib/flashalpha"
import type { FinraATSSummary } from "@/lib/finra-ats"
import type { UWSummary } from "@/lib/unusual-whales"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Tab = "uw" | "tradier" | "flashalpha" | "finra" | "compare"

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  )
}

function Value({ children, bull, bear }: { children: React.ReactNode; bull?: boolean; bear?: boolean }) {
  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold tabular-nums",
        bull && "text-[color:var(--color-bull)]",
        bear && "text-[color:var(--color-bear)]",
        !bull && !bear && "text-foreground"
      )}
    >
      {children}
    </span>
  )
}

function Stat({ label, value, bull, bear }: { label: string; value: string; bull?: boolean; bear?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <Value bull={bull} bear={bear}>{value}</Value>
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
        sentiment === "bullish" && "bg-[color:var(--color-bull)]/15 text-[color:var(--color-bull)]",
        sentiment === "bearish" && "bg-[color:var(--color-bear)]/15 text-[color:var(--color-bear)]",
        sentiment === "neutral" && "bg-muted text-muted-foreground"
      )}
    >
      {sentiment}
    </span>
  )
}

function SourceBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider", color)}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Unusual Whales
// ─────────────────────────────────────────────────────────────────────────────

function UWTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ data: UWSummary }>(
    `/api/ticker/${symbol}/flow`,
    fetcher,
    { refreshInterval: 60_000 }
  )
  const uw = data?.data

  if (isLoading) return <TabLoading />
  if (!uw) return <TabEmpty message="Unusual Whales data unavailable" />

  const cpRatio = uw.flow.callPutRatio
  const bull = uw.flow.bullishCount > uw.flow.bearishCount
  const bear = uw.flow.bearishCount > uw.flow.bullishCount

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SourceBadge color="bg-amber-500/15 text-amber-400">Unusual Whales</SourceBadge>
        <span className="font-mono text-[10px] text-muted-foreground">Options + Dark Pool</span>
      </div>

      {/* Dark Pool */}
      <div>
        <Label>Dark Pool</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-3">
          <Stat label="Total Size" value={uw.darkPool.totalSize.toLocaleString() + " sh"} />
          <Stat label="Premium" value={"$" + (uw.darkPool.totalPremium / 1_000_000).toFixed(2) + "M"} />
          <Stat label="Prints" value={String(uw.darkPool.prints.length)} />
        </div>
        {uw.darkPool.largestPrint && (
          <div className="mt-2 rounded border border-border/50 bg-muted/30 px-2.5 py-1.5">
            <Label>Largest Print</Label>
            <p className="mt-0.5 font-mono text-xs">
              {uw.darkPool.largestPrint.size.toLocaleString()} sh @ ${uw.darkPool.largestPrint.price.toFixed(2)}
              {" "}— ${(uw.darkPool.largestPrint.premium / 1_000_000).toFixed(2)}M
            </p>
          </div>
        )}
      </div>

      <div className="h-px bg-border/50" />

      {/* Options Flow */}
      <div>
        <Label>Options Flow</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <Stat
            label="Call Premium"
            value={"$" + (uw.flow.callPremium / 1_000_000).toFixed(2) + "M"}
            bull
          />
          <Stat
            label="Put Premium"
            value={"$" + (uw.flow.putPremium / 1_000_000).toFixed(2) + "M"}
            bear
          />
          <Stat
            label="C/P Ratio"
            value={cpRatio === Infinity ? "∞" : cpRatio.toFixed(2)}
            bull={cpRatio > 1.5}
            bear={cpRatio < 0.67}
          />
          <Stat
            label="Sentiment"
            value={bull ? "Bullish" : bear ? "Bearish" : "Neutral"}
            bull={bull}
            bear={bear}
          />
        </div>
      </div>

      {/* Top alerts */}
      {uw.flow.alerts.length > 0 && (
        <div className="space-y-1">
          <Label>Top Alerts</Label>
          {uw.flow.alerts.slice(0, 5).map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2.5 py-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-12 font-mono text-[9px] font-bold uppercase",
                    a.sentiment === "bullish" && "text-[color:var(--color-bull)]",
                    a.sentiment === "bearish" && "text-[color:var(--color-bear)]",
                    a.sentiment === "neutral" && "text-muted-foreground"
                  )}
                >
                  {a.type.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-foreground">
                  ${a.strike} {a.expiry.slice(5)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {a.volume.toLocaleString()} / {a.openInterest.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] font-semibold text-foreground">
                  ${(a.premium / 1_000).toFixed(0)}K
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Tradier Custom Detector
// ─────────────────────────────────────────────────────────────────────────────

function TradierTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ data: TradierFlowSummary }>(
    `/api/tradier/unusual?symbol=${symbol}`,
    fetcher,
    { refreshInterval: 60_000 }
  )
  const flow = data?.data

  if (isLoading) return <TabLoading />
  if (!flow) return <TabEmpty message="Tradier flow data unavailable" />

  const bull = flow.sentiment === "bullish"
  const bear = flow.sentiment === "bearish"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SourceBadge color="bg-blue-500/15 text-blue-400">Tradier Real-Time</SourceBadge>
        <SentimentBadge sentiment={flow.sentiment} />
      </div>

      {/* Stock volume context */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Vol Ratio"
          value={flow.stock_vol_ratio != null ? `${flow.stock_vol_ratio}x` : "—"}
          bull={flow.stock_vol_ratio != null && flow.stock_vol_ratio > 2}
          bear={false}
        />
        <Stat
          label="20d Change"
          value={flow.price_change_20d != null ? `${flow.price_change_20d > 0 ? "+" : ""}${flow.price_change_20d}%` : "—"}
          bull={flow.price_change_20d != null && flow.price_change_20d > 0}
          bear={flow.price_change_20d != null && flow.price_change_20d < 0}
        />
        <Stat
          label="Score"
          value={`${flow.sentiment_score > 0 ? "+" : ""}${flow.sentiment_score}`}
          bull={bull}
          bear={bear}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Call Vol" value={flow.call_volume.toLocaleString()} bull />
        <Stat label="Put Vol" value={flow.put_volume.toLocaleString()} bear />
        <Stat
          label="Est. Call Prem"
          value={"$" + (flow.call_premium_est / 1_000).toFixed(0) + "K"}
          bull
        />
        <Stat
          label="Est. Put Prem"
          value={"$" + (flow.put_premium_est / 1_000).toFixed(0) + "K"}
          bear
        />
        <Stat label="P/C Vol Ratio" value={flow.put_call_vol_ratio.toFixed(2)} />
        <Stat label="DW Call" value={flow.dw_call_volume.toLocaleString()} />
      </div>

      <div className="h-px bg-border/50" />

      {/* Unusual Calls */}
      {flow.unusual_calls.length > 0 && (
        <div className="space-y-1">
          <Label>Unusual Calls ({flow.unusual_calls.length})</Label>
          {flow.unusual_calls.slice(0, 4).map((c, i) => (
            <ContractRow key={i} contract={c} type="call" />
          ))}
        </div>
      )}

      {/* Unusual Puts */}
      {flow.unusual_puts.length > 0 && (
        <div className="space-y-1">
          <Label>Unusual Puts ({flow.unusual_puts.length})</Label>
          {flow.unusual_puts.slice(0, 4).map((p, i) => (
            <ContractRow key={i} contract={p} type="put" />
          ))}
        </div>
      )}
    </div>
  )
}

function ContractRow({
  contract,
  type,
}: {
  contract: { strike: number; expiry: string; volume: number; open_interest: number; vol_oi_ratio: number; premium_est: number; iv: number | null }
  type: "call" | "put"
}) {
  const bull = type === "call"
  return (
    <div className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2.5 py-1">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-8 font-mono text-[9px] font-bold uppercase",
            bull ? "text-[color:var(--color-bull)]" : "text-[color:var(--color-bear)]"
          )}
        >
          {type.toUpperCase()}
        </span>
        <span className="font-mono text-[10px]">
          ${contract.strike} {contract.expiry.slice(5)}
        </span>
        {contract.iv && (
          <span className="font-mono text-[10px] text-muted-foreground">
            IV {(contract.iv * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground">
          {contract.vol_oi_ratio.toFixed(1)}x
        </span>
        <span className="font-mono text-[10px] font-semibold">
          ${(contract.premium_est / 1_000).toFixed(0)}K
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: FlashAlpha
// ─────────────────────────────────────────────────────────────────────────────

function FlashAlphaTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ data: FAFullMetrics; configured: boolean }>(
    `/api/flashalpha/metrics?symbol=${symbol}`,
    fetcher,
    { refreshInterval: 120_000 }
  )

  if (isLoading) return <TabLoading />
  if (!data?.configured) {
    return (
      <TabEmpty message="FlashAlpha API key not configured. Add FLASHALPHA_API_KEY in project settings to enable institutional GEX/DEX metrics." />
    )
  }

  const { gex, iv, flow } = data.data

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SourceBadge color="bg-violet-500/15 text-violet-400">FlashAlpha</SourceBadge>
        <span className="font-mono text-[10px] text-muted-foreground">Institutional Analytics</span>
      </div>

      {/* GEX */}
      {gex && (
        <div>
          <Label>Greek Exposure</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <Stat
              label="Net GEX"
              value={gex.gex != null ? "$" + (gex.gex / 1_000_000).toFixed(1) + "M" : "—"}
              bull={gex.gex != null && gex.gex > 0}
              bear={gex.gex != null && gex.gex < 0}
            />
            <Stat
              label="GEX Flip"
              value={gex.gex_flip != null ? "$" + gex.gex_flip.toFixed(2) : "—"}
            />
            <Stat
              label="Call GEX"
              value={gex.call_gex != null ? "$" + (gex.call_gex / 1_000_000).toFixed(1) + "M" : "—"}
              bull
            />
            <Stat
              label="Put GEX"
              value={gex.put_gex != null ? "$" + (gex.put_gex / 1_000_000).toFixed(1) + "M" : "—"}
              bear
            />
            <Stat
              label="DEX"
              value={gex.dex != null ? "$" + (gex.dex / 1_000_000).toFixed(1) + "M" : "—"}
            />
            <Stat
              label="VEX"
              value={gex.vex != null ? "$" + (gex.vex / 1_000_000).toFixed(1) + "M" : "—"}
            />
          </div>
        </div>
      )}

      {iv && (
        <>
          <div className="h-px bg-border/50" />
          <div>
            <Label>Volatility Metrics</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <Stat
                label="IV Rank"
                value={iv.iv_rank != null ? iv.iv_rank.toFixed(0) + " / 100" : "—"}
                bull={iv.iv_rank != null && iv.iv_rank < 30}
                bear={iv.iv_rank != null && iv.iv_rank > 70}
              />
              <Stat
                label="IV Pctile"
                value={iv.iv_percentile != null ? iv.iv_percentile.toFixed(0) + "%" : "—"}
              />
              <Stat
                label="Current IV"
                value={iv.iv_current != null ? (iv.iv_current * 100).toFixed(1) + "%" : "—"}
              />
              <Stat
                label="IV - HV Spread"
                value={iv.iv_hv_spread != null ? (iv.iv_hv_spread > 0 ? "+" : "") + (iv.iv_hv_spread * 100).toFixed(1) + "%" : "—"}
                bull={iv.iv_hv_spread != null && iv.iv_hv_spread < 0}
                bear={iv.iv_hv_spread != null && iv.iv_hv_spread > 0.1}
              />
            </div>
          </div>
        </>
      )}

      {flow && (
        <>
          <div className="h-px bg-border/50" />
          <div>
            <Label>FlashAlpha Flow</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <Stat label="P/C Ratio" value={flow.put_call_ratio.toFixed(2)} />
              <Stat label="Unusual Calls" value={String(flow.unusual_calls.length)} bull />
              <Stat label="Unusual Puts" value={String(flow.unusual_puts.length)} bear />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: FINRA ATS
// ─────────────────────────────────────────────────────────────────────────────

function FinraTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ data: FinraATSSummary | null }>(
    `/api/finra/darkpool?symbol=${symbol}`,
    fetcher,
    { refreshInterval: 3_600_000 } // 1hr — data is weekly
  )

  if (isLoading) return <TabLoading />
  if (!data?.data) return <TabEmpty message="FINRA ATS dark pool data unavailable for this symbol. FINRA publishes this data weekly with a 2-week delay." />

  const { data: finra } = data

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SourceBadge color="bg-emerald-500/15 text-emerald-400">FINRA ATS</SourceBadge>
        <span className="font-mono text-[10px] text-muted-foreground">
          Free · 2-week lag · Week of {finra.latestWeek ?? "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total Dark Shares" value={finra.totalDarkPoolShares.toLocaleString()} />
        <Stat label="Total Trades" value={finra.totalDarkPoolTrades.toLocaleString()} />
      </div>

      <div className="h-px bg-border/50" />

      {finra.topVenues.length > 0 && (
        <div className="space-y-1">
          <Label>Top Dark Pool Venues</Label>
          {finra.topVenues.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2.5 py-1"
            >
              <span className="flex-1 truncate font-mono text-[10px] text-foreground">{v.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {v.shares.toLocaleString()} sh
                </span>
                <span className="w-10 text-right font-mono text-[10px] font-semibold text-[color:var(--color-bull)]">
                  {v.pctOfTotal}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {finra.weeklyTrend.length > 0 && (
        <div className="space-y-1">
          <Label>8-Week Trend</Label>
          {finra.weeklyTrend.slice(-4).map((w, i) => (
            <div key={i} className="flex items-center justify-between px-0.5 py-0.5">
              <span className="font-mono text-[10px] text-muted-foreground">{w.week}</span>
              <span className="font-mono text-[10px] tabular-nums">{w.shares.toLocaleString()} sh</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Side-by-side comparison
// ─────────────────────────────────────────────────────────────────────────────

function CompareTab({ symbol }: { symbol: string }) {
  const { data: uwData } = useSWR<{ data: UWSummary }>(`/api/ticker/${symbol}/flow`, fetcher, { refreshInterval: 60_000 })
  const { data: tradierData } = useSWR<{ data: TradierFlowSummary }>(`/api/tradier/unusual?symbol=${symbol}`, fetcher, { refreshInterval: 60_000 })
  const { data: faData } = useSWR<{ data: FAFullMetrics; configured: boolean }>(`/api/flashalpha/metrics?symbol=${symbol}`, fetcher, { refreshInterval: 120_000 })

  const uw = uwData?.data
  const tradier = tradierData?.data
  const fa = faData?.data
  const faOk = faData?.configured

  const rows: { metric: string; uw: string | null; tradier: string | null; flashalpha: string | null }[] = [
    {
      metric: "Call Premium",
      uw: uw ? "$" + (uw.flow.callPremium / 1_000_000).toFixed(2) + "M" : null,
      tradier: tradier ? "$" + (tradier.call_premium_est / 1_000).toFixed(0) + "K" : null,
      flashalpha: fa?.flow ? "$" + (fa.flow.call_premium / 1_000_000).toFixed(2) + "M" : null,
    },
    {
      metric: "Put Premium",
      uw: uw ? "$" + (uw.flow.putPremium / 1_000_000).toFixed(2) + "M" : null,
      tradier: tradier ? "$" + (tradier.put_premium_est / 1_000).toFixed(0) + "K" : null,
      flashalpha: fa?.flow ? "$" + (fa.flow.put_premium / 1_000_000).toFixed(2) + "M" : null,
    },
    {
      metric: "P/C Ratio",
      uw: uw ? uw.flow.callPutRatio.toFixed(2) : null,
      tradier: tradier ? tradier.put_call_vol_ratio.toFixed(2) : null,
      flashalpha: fa?.flow ? fa.flow.put_call_ratio.toFixed(2) : null,
    },
    {
      metric: "Bullish Alerts",
      uw: uw ? String(uw.flow.bullishCount) : null,
      tradier: tradier ? String(tradier.unusual_calls.length) : null,
      flashalpha: fa?.flow ? String(fa.flow.unusual_calls.length) : null,
    },
    {
      metric: "Bearish Alerts",
      uw: uw ? String(uw.flow.bearishCount) : null,
      tradier: tradier ? String(tradier.unusual_puts.length) : null,
      flashalpha: fa?.flow ? String(fa.flow.unusual_puts.length) : null,
    },
    {
      metric: "Dark Pool Size",
      uw: uw ? uw.darkPool.totalSize.toLocaleString() + " sh" : null,
      tradier: "N/A — see FINRA tab",
      flashalpha: "N/A",
    },
    {
      metric: "GEX",
      uw: uw?.greekExposure ? `call: ${uw.greekExposure.callGamma ?? "—"} / put: ${uw.greekExposure.putGamma ?? "—"}` : null,
      tradier: "computed on-chain",
      flashalpha: fa?.gex?.gex != null ? "$" + (fa.gex.gex / 1_000_000).toFixed(1) + "M" : null,
    },
    {
      metric: "IV Rank",
      uw: "not provided",
      tradier: "not provided",
      flashalpha: fa?.iv?.iv_rank != null ? fa.iv.iv_rank.toFixed(0) + "/100" : null,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <SourceBadge color="bg-amber-500/15 text-amber-400">UW</SourceBadge>
        <SourceBadge color="bg-blue-500/15 text-blue-400">Tradier</SourceBadge>
        <SourceBadge color="bg-violet-500/15 text-violet-400">FlashAlpha</SourceBadge>
        <span className="font-mono text-[10px] text-muted-foreground">Side-by-side comparison</span>
      </div>

      <div className="rounded border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 bg-muted/40 px-2 py-1.5 border-b border-border">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Metric</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400">UW</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400">Tradier</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400">FA</span>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-4 px-2 py-1.5 border-b border-border/40 last:border-0 hover:bg-muted/20"
          >
            <span className="font-mono text-[10px] text-muted-foreground">{row.metric}</span>
            <span className="font-mono text-[10px] tabular-nums">{row.uw ?? "—"}</span>
            <span className="font-mono text-[10px] tabular-nums">{row.tradier ?? "—"}</span>
            <span className={cn("font-mono text-[10px] tabular-nums", !faOk && "text-muted-foreground/50")}>
              {faOk ? (row.flashalpha ?? "—") : "no key"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TabLoading() {
  return (
    <div className="flex h-32 items-center justify-center">
      <span className="font-mono text-xs text-muted-foreground animate-pulse">Loading...</span>
    </div>
  )
}

function TabEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center px-4 text-center">
      <span className="font-mono text-xs text-muted-foreground leading-relaxed">{message}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "uw", label: "UW", color: "data-[active=true]:text-amber-400 data-[active=true]:border-amber-400" },
  { id: "tradier", label: "Tradier", color: "data-[active=true]:text-blue-400 data-[active=true]:border-blue-400" },
  { id: "flashalpha", label: "FlashAlpha", color: "data-[active=true]:text-violet-400 data-[active=true]:border-violet-400" },
  { id: "finra", label: "FINRA", color: "data-[active=true]:text-emerald-400 data-[active=true]:border-emerald-400" },
  { id: "compare", label: "Compare", color: "data-[active=true]:text-foreground data-[active=true]:border-foreground" },
]

export function AdvancedOptionsFlow({ symbol }: { symbol: string }) {
  const [active, setActive] = useState<Tab>("uw")

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-active={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground",
              t.color
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {active === "uw" && <UWTab symbol={symbol} />}
        {active === "tradier" && <TradierTab symbol={symbol} />}
        {active === "flashalpha" && <FlashAlphaTab symbol={symbol} />}
        {active === "finra" && <FinraTab symbol={symbol} />}
        {active === "compare" && <CompareTab symbol={symbol} />}
      </div>
    </div>
  )
}
