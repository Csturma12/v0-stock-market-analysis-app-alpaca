"use client"

import useSWR from "swr"
import { KeyMetrics } from "./key-metrics"
import { fmtCompact, fmtPct, fmtPrice, fmtVolume } from "@/lib/format"

type Metric = {
  label: string
  value: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function KeyMetricsDisplay({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase()
  const { data, isLoading } = useSWR(`/api/ticker/${encodeURIComponent(sym)}`, fetcher, {
    refreshInterval: 60_000,
    revalidateOnMount: true,
    keepPreviousData: false,
  })

  const snapshot = data?.snapshot ?? {}
  const profile = data?.profile ?? {}
  const technicals = data?.technicals ?? {}
  const priceTarget = data?.priceTarget ?? {}
  const flashAlpha = data?.flashAlpha ?? {}
  const tradierFlow = data?.tradierFlow ?? {}

  const metrics: Metric[] = [
    { label: "Price", value: fmtPrice(snapshot.price) },
    { label: "Day %", value: snapshot.changePct == null ? "-" : fmtPct(snapshot.changePct) },
    { label: "Mkt Cap", value: profile.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(2)}B` : "-" },
    { label: "Volume", value: fmtVolume(technicals.latestVolume) },
    { label: "Vol Ratio", value: technicals.volumeRatio == null ? "-" : `${technicals.volumeRatio.toFixed(2)}x` },
    { label: "RSI 14", value: technicals.rsi14 == null ? "-" : technicals.rsi14.toFixed(1) },
    { label: "SMA 20", value: fmtPrice(technicals.sma20) },
    { label: "SMA 50", value: fmtPrice(technicals.sma50) },
    { label: "Target", value: fmtPrice(priceTarget.targetMean) },
    { label: "GEX", value: fmtCompact(flashAlpha.gex?.netGamma ?? flashAlpha.gex?.gammaExposure) },
    { label: "Flow $", value: fmtCompact(tradierFlow.totalPremium) },
    { label: "Bias", value: tradierFlow.sentiment ?? "-" },
  ]

  if (isLoading && !data) {
    return <KeyMetrics metrics={[{ label: sym, value: "Loading" }]} />
  }

  return <KeyMetrics metrics={metrics} />
}
