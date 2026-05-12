"use client"

import { useTradingMode } from "@/lib/trading-context"
import { cn } from "@/lib/utils"
import { TestTube, Zap, AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function TradingModeToggle() {
  const { mode, toggleMode, isPaper, isLive } = useTradingMode()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleMode}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all",
              isPaper
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
                : "bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20"
            )}
          >
            {isPaper ? (
              <>
                <TestTube className="h-3 w-3" />
                Paper
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Live
              </>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="text-xs">
            {isPaper ? (
              <>
                <p className="font-semibold">Paper Trading Mode</p>
                <p className="text-muted-foreground mt-1">Orders go to Alpaca paper account. No real money at risk.</p>
              </>
            ) : (
              <>
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Live Trading Mode
                </p>
                <p className="text-muted-foreground mt-1">Orders go to Webull. Real money is at risk!</p>
              </>
            )}
            <p className="text-muted-foreground/60 mt-2 text-[10px]">Click to toggle</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function TradingModeIndicator() {
  const { isPaper, isLive, broker } = useTradingMode()

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[9px] uppercase",
        isPaper
          ? "bg-amber-500/10 text-amber-500"
          : "bg-green-500/10 text-green-500"
      )}
    >
      {isPaper ? <TestTube className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
      {broker}
    </div>
  )
}
