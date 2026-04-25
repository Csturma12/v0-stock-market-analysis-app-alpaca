"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    TradingView?: any
  }
}

export function TickerChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing content
    containerRef.current.innerHTML = ""

    // Create wrapper div for TradingView widget
    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widget = document.createElement("div")
    widget.className = "tradingview-widget-container__widget"
    widget.id = `tradingview-chart-${symbol}`
    widget.style.height = "100%"
    widget.style.width = "100%"

    widgetContainer.appendChild(widget)
    containerRef.current.appendChild(widgetContainer)

    // Load TradingView script
    if (!window.TradingView) {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      script.async = true
      script.onload = () => {
        // Initialize chart after script loads
        if (window.TradingView?.MediumWidget || window.TradingView?.advanced_chart) {
          createChart()
        }
      }
      document.body.appendChild(script)
    } else {
      createChart()
    }

    function createChart() {
      const config = {
        autosize: true,
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: "https://www.tradingview.com",
      }

      // Use TradingView's new embed method
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.innerHTML = `
        (function() {
          new window.TradingView.advanced_chart.AdvancedChart({
            ...${JSON.stringify(config)},
            container_id: "tradingview-chart-${symbol}"
          });
        })();
      `
      containerRef.current?.appendChild(script)
    }
  }, [symbol])

  return (
    <div
      ref={containerRef}
      className="h-[600px] w-full rounded-lg border border-border bg-card p-0 overflow-hidden"
    />
  )
}
