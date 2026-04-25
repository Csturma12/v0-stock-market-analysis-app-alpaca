"use client"

import { useEffect, useRef } from "react"

export function TickerChart({ symbol, className = "" }: { symbol: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Reset container before (re)mounting widget
    containerRef.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widget = document.createElement("div")
    widget.className = "tradingview-widget-container__widget"
    widget.style.height = "calc(100% - 32px)"
    widget.style.width = "100%"

    widgetContainer.appendChild(widget)

    // TradingView's embed script reads its JSON config from its own innerText
    // and renders into the nearest .tradingview-widget-container__widget sibling.
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    })

    widgetContainer.appendChild(script)
    containerRef.current.appendChild(widgetContainer)
  }, [symbol])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg border border-border bg-card overflow-hidden ${className}`}
    />
  )
}
