"use client"

import { useEffect, useState } from "react"
import { Maximize2, Minimize2 } from "lucide-react"

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      /* user cancelled or unsupported */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
      title={isFullscreen ? "Exit full screen" : "Enter full screen"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  )
}
