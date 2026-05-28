"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { WidgetFrame } from "./widget-frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatCurrency, formatNumber, formatTime } from "@/lib/format"

type Tab = "flow" | "historic" | "intraday" | "profile"

type TickerFlowAlert = {
  optionChain: string
  type: "call" | "put"
  strike: number
  expiry: string
  premium: number
  createdAt: string
}

type FlowTrade = {
  time: string
  price: number
  size: number
  side: "ask" | "bid" | "mid"
  premium: number
}

type HistoricPoint = {
  date: string
  close: number
  openInterest: number
}

type IntradayPoint = {
  time: string
  askVol: number
  bidVol: number
  midVol: number
}

type VolumeProfile = {
  price: number
  volume: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null)

export function OptionContractDrillDownWidget({ symbol }: { symbol?: string }) {
  const [contractId, setContractId] = useState("")
  const [activeContract, setActiveContract] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("flow")
  const sym = symbol?.toUpperCase()

  const { data: tickerFlow } = useSWR<{ alerts: TickerFlowAlert[] }>(
    sym ? `/api/uw/ticker/${encodeURIComponent(sym)}/options-flow` : null,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnMount: true,
      keepPreviousData: false,
    },
  )

  const topContracts = useMemo(() => {
    const seen = new Set<string>()
    return (tickerFlow?.alerts ?? [])
      .filter((alert) => alert.optionChain)
      .sort((a, b) => b.premium - a.premium)
      .filter((alert) => {
        if (seen.has(alert.optionChain)) return false
        seen.add(alert.optionChain)
        return true
      })
      .slice(0, 6)
  }, [tickerFlow])

  const activeStrike = useMemo(() => {
    const match = tickerFlow?.alerts.find((a) => a.optionChain.toUpperCase() === activeContract)
    return match?.strike ?? null
  }, [activeContract, tickerFlow])

  useEffect(() => {
    setContractId("")
    setActiveContract(null)
    setTab("flow")
  }, [sym])

  useEffect(() => {
    if (!activeContract && topContracts[0]?.optionChain) {
      setActiveContract(topContracts[0].optionChain.toUpperCase())
    }
  }, [activeContract, topContracts])

  const handleSearch = useCallback(() => {
    if (contractId.trim()) {
      setActiveContract(contractId.trim().toUpperCase())
    }
  }, [contractId])

  const { data: flowData, isLoading: flowLoading } = useSWR<FlowTrade[]>(
    activeContract && tab === "flow" ? `/api/uw/contract/${activeContract}/flow` : null,
    fetcher
  )

  const { data: historicData, isLoading: historicLoading } = useSWR<HistoricPoint[]>(
    activeContract && tab === "historic" ? `/api/uw/contract/${activeContract}/historic` : null,
    fetcher
  )

  const { data: intradayData, isLoading: intradayLoading } = useSWR<IntradayPoint[]>(
    activeContract && tab === "intraday" ? `/api/uw/contract/${activeContract}/intraday` : null,
    fetcher
  )

  const { data: profileData, isLoading: profileLoading } = useSWR<VolumeProfile[]>(
    activeContract && tab === "profile" ? `/api/uw/contract/${activeContract}/profile` : null,
    fetcher
  )

  const isLoading = flowLoading || historicLoading || intradayLoading || profileLoading

  return (
    <WidgetFrame
      title="Option Contract Drill-Down"
      isLoading={isLoading}
      headerRight={
        activeContract ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="h-7">
              <TabsTrigger value="flow" className="text-xs px-2 py-1">Flow</TabsTrigger>
              <TabsTrigger value="historic" className="text-xs px-2 py-1">Historic</TabsTrigger>
              <TabsTrigger value="intraday" className="text-xs px-2 py-1">Intraday</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs px-2 py-1">Profile</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null
      }
    >
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder={sym ? `Search ${sym} contract ID` : "Enter contract ID"}
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={handleSearch} className="h-8 px-3">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {topContracts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {topContracts.map((contract) => (
            <button
              key={contract.optionChain}
              type="button"
              onClick={() => setActiveContract(contract.optionChain.toUpperCase())}
              className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
                activeContract === contract.optionChain.toUpperCase()
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
              title={`${contract.type.toUpperCase()} ${contract.expiry} $${contract.strike}`}
            >
              {contract.type.toUpperCase()} ${contract.strike}
            </button>
          ))}
        </div>
      )}

      {!activeContract ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          {sym ? `Waiting for ${sym} option flow...` : "Enter a contract ID above to view details"}
        </div>
      ) : (
        <>
          {/* Active contract badge */}
          <div className="mb-3 text-xs">
            <span className="text-muted-foreground">Viewing: </span>
            <span className="font-mono font-medium">{activeContract}</span>
          </div>

          {/* Tab content */}
          {tab === "flow" && (
            <div className="max-h-[220px] overflow-y-auto text-xs">
              {flowData && flowData.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-background">
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-1 font-medium">Time</th>
                      <th className="py-1 font-medium text-right">Strike</th>
                      <th className="py-1 font-medium text-right">Price</th>
                      <th className="py-1 font-medium text-right">Size</th>
                      <th className="py-1 font-medium text-right">Premium</th>
                      <th className="py-1 font-medium">Side</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flowData.slice(0, 50).map((t, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1">{formatTime(t.time)}</td>
                        <td className="py-1 text-right">{activeStrike !== null ? `$${activeStrike.toFixed(0)}` : "—"}</td>
                        <td className="py-1 text-right">{formatCurrency(t.price)}</td>
                        <td className="py-1 text-right">{formatNumber(t.size)}</td>
                        <td className="py-1 text-right">{formatCurrency(t.premium)}</td>
                        <td className={`py-1 ${t.side === "ask" ? "text-green-500" : t.side === "bid" ? "text-red-500" : ""}`}>
                          {t.side.toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  No flow data available
                </div>
              )}
            </div>
          )}

          {tab === "historic" && (
            <div className="h-[220px]">
              {historicData && historicData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...historicData].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis yAxisId="price" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <YAxis yAxisId="oi" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Line yAxisId="price" type="monotone" dataKey="close" name="Close" stroke="#3b82f6" dot={false} strokeWidth={2} />
                    <Line yAxisId="oi" type="monotone" dataKey="openInterest" name="OI" stroke="#94a3b8" dot={false} strokeWidth={1} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No historic data available
                </div>
              )}
            </div>
          )}

          {tab === "intraday" && (
            <div className="h-[220px]">
              {intradayData && intradayData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intradayData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="askVol" name="Ask Vol" stackId="a" fill="#22c55e" />
                    <Bar dataKey="bidVol" name="Bid Vol" stackId="a" fill="#ef4444" />
                    <Bar dataKey="midVol" name="Mid Vol" stackId="a" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No intraday data available
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="h-[220px]">
              {profileData && profileData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profileData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="price" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} width={45} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => formatNumber(v)} />
                    <Bar dataKey="volume" fill="#3b82f6">
                      {profileData.map((entry, index) => {
                        const maxVol = Math.max(...profileData.map((p) => p.volume))
                        const intensity = entry.volume / maxVol
                        return <Cell key={index} fill={`rgba(59, 130, 246, ${0.3 + intensity * 0.7})`} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No volume profile data available
                </div>
              )}
            </div>
          )}
        </>
      )}
    </WidgetFrame>
  )
}
