"use client"

import { useState } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmtCompact, fmtUsd, timeAgo } from "@/lib/format"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

type Props = { symbol?: string }
type Alert = {
  createdAt: string
  optionChain: string
  ticker: string
  type: "call" | "put"
  strike: number
  expiry: string
  premium: number
  volume: number
  openInterest: number
  side: "ask" | "bid" | "mid"
  sentiment: "bullish" | "bearish" | "neutral"
  isSweep?: boolean
  isBlock?: boolean
}
type Chain = {
  ticker: string
  optionChain: string
  totalPremium: number
  totalVolume: number
  callPremium: number
  putPremium: number
  sentiment: "bullish" | "bearish" | "neutral"
}
type Stats = {
  callPremium: number
  putPremium: number
  callPutRatio: number
  blockCount: number
  sweepCount: number
  sentiment: "bullish" | "bearish" | "neutral"
}
type MarketResp = { alerts: Alert[]; chains: Chain[]; stats: Stats | null }
type TickerResp = { alerts: Alert[]; stats: Stats | null }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function OptionsBlockTradesWidget({ symbol }: Props) {
  const [tab, setTab] = useState<"flow" | "blocks" | "chains" | "chart">("flow")

  const marketEp = `/api/uw/flow-alerts`
  const tickerEp = symbol ? `/api/uw/ticker/${symbol}/options-flow` : null

  const { data: mktData } = useSWR<MarketResp>(symbol ? null : marketEp, fetcher, { refreshInterval: 60_000 })
  const { data: tkrData, isLoading, error } = useSWR<TickerResp>(tickerEp, fetcher, { refreshInterval: 60_000 })

  const alerts = symbol ? (tkrData?.alerts ?? []) : (mktData?.alerts ?? [])
  const chains = mktData?.chains ?? []
  const stats = symbol ? tkrData?.stats : mktData?.stats
  const blocks = alerts.filter((a) => a.isBlock)

  // Chart data: call vs put by strike (ticker mode) or by ticker (market mode)
  let chartData: { label: string; call: number; put: number }[] = []
  if (symbol) {
    const strikeMap = new Map<number, { call: number; put: number }>()
    alerts.forEach((a) => {
      const entry = strikeMap.get(a.strike) ?? { call: 0, put: 0 }
      if (a.type === "call") entry.call += a.premium
      else entry.put += a.premium
      strikeMap.set(a.strike, entry)
    })
    chartData = Array.from(strikeMap.entries())
      .map(([strike, { call, put }]) => ({ label: `$${strike}`, call, put }))
      .sort((a, b) => parseFloat(a.label.slice(1)) - parseFloat(b.label.slice(1)))
      .slice(0, 15)
  } else {
    const tickerMap = new Map<string, { call: number; put: number }>()
    alerts.forEach((a) => {
      const entry = tickerMap.get(a.ticker) ?? { call: 0, put: 0 }
      if (a.type === "call") entry.call += a.premium
      else entry.put += a.premium
      tickerMap.set(a.ticker, entry)
    })
    chartData = Array.from(tickerMap.entries())
      .map(([ticker, { call, put }]) => ({ label: ticker, call, put }))
      .sort((a, b) => (b.call + b.put) - (a.call + a.put))
      .slice(0, 12)
  }

  const sentimentColor = stats?.sentiment === "bullish" ? "text-primary" : stats?.sentiment === "bearish" ? "text-destructive" : "text-muted-foreground"
  const displayList = tab === "blocks" ? blocks : alerts

  return (
    <WidgetFrame
      title={symbol ? "Options Flow & Blocks" : "Market Options Flow"}
      isLoading={isLoading}
      error={error ? "Failed to load" : undefined}
      headerRight={
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="flow" className="text-xs px-2 py-1">Flow</TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs px-2 py-1">Blocks</TabsTrigger>
            {!symbol && <TabsTrigger value="chains" className="text-xs px-2 py-1">Chains</TabsTrigger>}
            <TabsTrigger value="chart" className="text-xs px-2 py-1">Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Call $</div>
            <div className="font-medium text-primary">{fmtCompact(stats.callPremium)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Put $</div>
            <div className="font-medium text-destructive">{fmtCompact(stats.putPremium)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">C/P Ratio</div>
            <div className="font-medium">{stats.callPutRatio.toFixed(2)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Sentiment</div>
            <div className={`font-medium capitalize ${sentimentColor}`}>{stats.sentiment}</div>
          </div>
        </div>
      )}

      {tab === "chart" ? (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtCompact(v)} />
              <Tooltip formatter={(v: number) => fmtUsd(v, 0)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="call" name="Calls" fill="#22c55e" />
              <Bar dataKey="put" name="Puts" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : tab === "chains" ? (
        <div className="max-h-[260px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Ticker</th>
                <th className="py-1 font-medium text-right">Call $</th>
                <th className="py-1 font-medium text-right">Put $</th>
                <th className="py-1 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {chains.slice(0, 20).map((c, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 font-medium">{c.ticker}</td>
                  <td className="py-1 text-right text-primary">{fmtCompact(c.callPremium)}</td>
                  <td className="py-1 text-right text-destructive">{fmtCompact(c.putPremium)}</td>
                  <td className="py-1 text-right font-medium">{fmtCompact(c.totalPremium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-h-[260px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 font-medium">Time</th>
                {!symbol && <th className="py-1 font-medium">Ticker</th>}
                <th className="py-1 font-medium">Type</th>
                <th className="py-1 font-medium text-right">Strike</th>
                <th className="py-1 font-medium text-right">Premium</th>
              </tr>
            </thead>
            <tbody>
              {displayList.slice(0, 50).map((a, i) => {
                const typeColor = a.type === "call" ? "text-primary" : "text-destructive"
                const rowBg = a.isBlock ? "bg-yellow-500/10" : a.isSweep ? "bg-blue-500/10" : ""
                return (
                  <tr key={i} className={`border-b border-border/50 ${rowBg}`}>
                    <td className="py-1">{timeAgo(a.createdAt)}</td>
                    {!symbol && <td className="py-1 font-medium">{a.ticker}</td>}
                    <td className={`py-1 uppercase font-medium ${typeColor}`}>
                      {a.type}{a.isSweep ? " 🧹" : ""}{a.isBlock ? " 📦" : ""}
                    </td>
                    <td className="py-1 text-right">${a.strike}</td>
                    <td className="py-1 text-right font-medium">{fmtCompact(a.premium)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
