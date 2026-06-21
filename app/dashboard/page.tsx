"use client"

import { useState, useCallback } from "react"
import GridLayout from "react-grid-layout"
import Link from "next/link"
import useSWR from "swr"
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, Briefcase, 
  Activity, Zap, Settings, ChevronRight, Plus, X,
  Factory, Cpu, Heart, Building2, ShoppingCart, Landmark, 
  Fuel, Lightbulb, Home, Pickaxe, Radio
} from "lucide-react"
import { SECTORS } from "@/lib/constants"
import { THEMES } from "@/lib/themes"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type LayoutItem = {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

// Sector icons mapping
const SECTOR_ICONS: Record<string, React.ElementType> = {
  technology: Cpu,
  "health-care": Heart,
  financials: Landmark,
  "consumer-discretionary": ShoppingCart,
  "communication-services": Radio,
  industrials: Factory,
  "consumer-staples": ShoppingCart,
  energy: Fuel,
  utilities: Lightbulb,
  "real-estate": Home,
  materials: Pickaxe,
}

// Default layout
const defaultLayout: LayoutItem[] = [
  { i: "account", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "signals", x: 4, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
  { i: "positions", x: 8, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
  { i: "chart", x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  { i: "sectors", x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "themes", x: 6, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "commodities", x: 0, y: 9, w: 12, h: 2, minW: 4, minH: 2 },
]

// Commodities data - now fetched from Polygon API
// (kept for icon mapping only)
const COMMODITY_ICONS: Record<string, string> = {
  "Gold": "Au",
  "Silver": "Ag", 
  "Crude Oil": "OIL",
  "Natural Gas": "NG",
  "Copper": "Cu",
  "Bitcoin": "BTC",
  "Ethereum": "ETH",
  "Platinum": "Pt",
}

function Widget({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/30 cursor-move">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-muted rounded transition-colors">
            <Settings className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  )
}

function AccountWidget() {
  const { data } = useSWR("/api/trading/account", fetcher, { refreshInterval: 15000 })
  const account = data?.account
  
  const equity = account?.equity ? parseFloat(account.equity) : 0
  const buyingPower = account?.buying_power ? parseFloat(account.buying_power) : 0
  const dayPL = account?.equity && account?.last_equity 
    ? parseFloat(account.equity) - parseFloat(account.last_equity) 
    : 0
  const dayPLPct = account?.last_equity ? (dayPL / parseFloat(account.last_equity)) * 100 : 0

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      <div className="flex flex-col justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Portfolio Value</span>
        <span className="text-xl font-bold">${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Daily P&L</span>
        <span className={`text-xl font-bold ${dayPL >= 0 ? "text-green-500" : "text-red-500"}`}>
          {dayPL >= 0 ? "+" : ""}${dayPL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-sm ml-1">({dayPLPct >= 0 ? "+" : ""}{dayPLPct.toFixed(2)}%)</span>
        </span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Buying Power</span>
        <span className="text-lg font-semibold text-muted-foreground">${buyingPower.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Open Trades</span>
        <span className="text-lg font-semibold text-muted-foreground">{data?.positions?.length ?? 0}</span>
      </div>
    </div>
  )
}

function SignalsWidget() {
  const { data, isLoading } = useSWR("/api/dashboard/signals", fetcher, { refreshInterval: 10000 })
  const signals = data?.signals || []

  if (isLoading && signals.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground mb-1">Loading UW flow signals...</p>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-md bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-xs">No flow signals right now</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground mb-1">UW Flow Alerts - Scan, click, decide.</p>
      {signals.slice(0, 8).map((s: any, i: number) => (
        <Link
          key={`${s.ticker}-${i}`}
          href={`/ticker/${s.ticker}`}
          className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {s.action === "BUY" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {s.action === "SELL" && <TrendingDown className="h-3 w-3 text-red-500" />}
            {s.action === "NO_TRADE" && <Minus className="h-3 w-3 text-muted-foreground" />}
            <div>
              <span className="font-semibold text-sm">{s.ticker}</span>
              <p className="text-[10px] text-muted-foreground">{s.setup}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{s.confidence}%</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              s.action === "BUY" ? "bg-green-500/20 text-green-500" : 
              s.action === "SELL" ? "bg-red-500/20 text-red-500" : 
              "bg-muted text-muted-foreground"
            }`}>
              {s.action.replace("_", " ")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PositionsWidget() {
  const { data } = useSWR("/api/trading/positions", fetcher, { refreshInterval: 15000 })
  const positions = data?.positions ?? []

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Briefcase className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-xs">No open positions</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {positions.slice(0, 6).map((p: any) => {
        const pl = parseFloat(p.unrealized_pl || 0)
        const plPct = parseFloat(p.unrealized_plpc || 0) * 100
        return (
          <Link
            key={p.symbol}
            href={`/ticker/${p.symbol}`}
            className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <div>
              <span className="font-semibold text-sm">{p.symbol}</span>
              <p className="text-[10px] text-muted-foreground">{p.qty} shares @ ${parseFloat(p.avg_entry_price).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
              </span>
              <p className={`text-[10px] ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ChartWidget() {
  const [symbol] = useState("AAPL")
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold">{symbol} Analysis</span>
          <p className="text-[10px] text-muted-foreground">15-minute chart · Pullback setup</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">BUY</span>
      </div>
      <div className="flex-1 bg-muted/20 rounded-md flex items-center justify-center border border-border">
        <span className="text-muted-foreground text-xs">TradingView Chart</span>
      </div>
      <div className="flex gap-2 mt-2">
        {["RSI 61", "Above VWAP", "EMA bullish", "Volume +21%"].map((indicator) => (
          <span key={indicator} className="text-[9px] px-2 py-1 rounded-full bg-muted border border-border">
            {indicator}
          </span>
        ))}
      </div>
    </div>
  )
}

function SectorsWidget() {
  return (
    <div className="flex flex-wrap gap-2 content-start">
      {SECTORS.map((sector) => {
        const Icon = SECTOR_ICONS[sector.id] || Factory
        return (
          <Link
            key={sector.id}
            href={`/sector/${sector.id}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-xs"
          >
            <Icon className="h-3 w-3 text-primary" />
            <span className="font-medium">{sector.name}</span>
            <span className="text-[10px] text-muted-foreground">{sector.etf}</span>
          </Link>
        )
      })}
    </div>
  )
}

function ThemesWidget() {
  return (
    <div className="flex flex-wrap gap-2 content-start">
      {THEMES.slice(0, 8).map((theme) => (
        <Link
          key={theme.id}
          href={`/theme/${theme.id}`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors text-xs ${
            theme.accent === "primary" ? "border-primary/50 bg-primary/10 hover:bg-primary/20" :
            theme.accent === "bull" ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20" :
            theme.accent === "bear" ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20" :
            "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20"
          }`}
        >
          <Zap className={`h-3 w-3 ${
            theme.accent === "primary" ? "text-primary" :
            theme.accent === "bull" ? "text-green-500" :
            theme.accent === "bear" ? "text-red-500" :
            "text-yellow-500"
          }`} />
          <span className="font-medium">{theme.name}</span>
        </Link>
      ))}
    </div>
  )
}

function CommoditiesWidget() {
  const { data, isLoading } = useSWR("/api/dashboard/commodities", fetcher, { refreshInterval: 60000 })
  const commodities = data?.commodities || []

  if (isLoading && commodities.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 w-24 rounded-lg bg-muted/30 animate-pulse shrink-0" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {commodities.map((c: any) => (
        <div
          key={c.symbol}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors shrink-0"
        >
          <span className="text-xs font-mono font-bold text-muted-foreground">{COMMODITY_ICONS[c.name] || c.name.slice(0, 2)}</span>
          <div>
            <span className="font-medium text-xs">{c.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">${c.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className={`text-[10px] ${c.changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
                {c.changePct >= 0 ? "+" : ""}{c.changePct?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [layout, setLayout] = useState(defaultLayout)

  const onLayoutChange = useCallback((newLayout: any) => {
    setLayout(newLayout)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold text-sm">Have It Your Way Trading</h1>
                <p className="text-[10px] text-muted-foreground">AI signals + risk-controlled execution</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full border border-green-500/50 bg-green-500/10 text-green-500 text-xs font-semibold">
              Market Open
            </span>
            <span className="px-3 py-1 rounded-full border border-border bg-muted text-xs">
              Buying Power: $10,000
            </span>
            <span className="px-3 py-1 rounded-full border border-red-500/50 bg-red-500/10 text-red-500 text-xs font-semibold">
              Automation: OFF
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar + Grid */}
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-48 shrink-0 border-r border-border bg-card/50 min-h-[calc(100vh-57px)] p-3">
          <nav className="flex flex-col gap-1">
            {[
              { name: "Dashboard", href: "/dashboard", active: true },
              { name: "Signals", href: "/signals" },
              { name: "Trades", href: "/trading" },
              { name: "Performance", href: "/performance" },
              { name: "Settings", href: "/settings" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  item.active 
                    ? "bg-primary text-primary-foreground font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Grid */}
        <div className="flex-1 p-4">
          <GridLayout
            className="layout"
            layout={layout}
            width={1200}
            gridConfig={{ cols: 12, rowHeight: 60, margin: [12, 12] }}
            resizeConfig={{ handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] }}
            dragConfig={{ handle: ".cursor-move" }}
            onLayoutChange={onLayoutChange}
          >
            <div key="account">
              <Widget title="Account Summary">
                <AccountWidget />
              </Widget>
            </div>
            <div key="signals">
              <Widget title="Signals">
                <SignalsWidget />
              </Widget>
            </div>
            <div key="positions">
              <Widget title="Open Positions">
                <PositionsWidget />
              </Widget>
            </div>
            <div key="chart">
              <Widget title="Chart Analysis">
                <ChartWidget />
              </Widget>
            </div>
            <div key="sectors">
              <Widget title="Sectors">
                <SectorsWidget />
              </Widget>
            </div>
            <div key="themes">
              <Widget title="Themes">
                <ThemesWidget />
              </Widget>
            </div>
            <div key="commodities">
              <Widget title="Commodities">
                <CommoditiesWidget />
              </Widget>
            </div>
          </GridLayout>
        </div>
      </div>
    </main>
  )
}
