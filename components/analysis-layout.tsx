"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout"
import { RotateCcw, Lock, Unlock } from "lucide-react"
import { WidgetFrame } from "./widget-frame"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ReactGridLayout = WidthProvider(GridLayout)

export type Widget = {
  id: string
  title: string
  content: ReactNode
  /** {x, y, w, h} on a 12-col grid + optional minW/minH */
  defaultLayout: Omit<Layout, "i">
}

type AnalysisLayoutProps = {
  widgets: Widget[]
  /** localStorage key — bump version when defaults change to invalidate */
  storageKey?: string
}

const ALL_HANDLES: Layout["resizeHandles"] = ["s", "n", "e", "w", "se", "sw", "ne", "nw"]

export function AnalysisLayout({
  widgets,
  storageKey = "analysis:grid:v1",
}: AnalysisLayoutProps) {
  const defaults = useMemo<Layout[]>(
    () =>
      widgets.map((w) => ({
        i: w.id,
        ...w.defaultLayout,
        resizeHandles: ALL_HANDLES,
      })),
    [widgets],
  )

  const [layout, setLayout] = useState<Layout[]>(defaults)
  const [hydrated, setHydrated] = useState(false)
  const [locked, setLocked] = useState(false)

  // Load saved layout on mount, merging with current widget ids so newly
  // added widgets fall back to their default position.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw) as Layout[]
        const merged = widgets.map((w) => {
          const found = saved.find((s) => s.i === w.id)
          return {
            i: w.id,
            ...w.defaultLayout,
            ...(found ?? {}),
            resizeHandles: ALL_HANDLES,
          }
        })
        setLayout(merged)
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [widgets, storageKey])

  const handleChange = (next: Layout[]) => {
    setLayout(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const handleReset = () => {
    setLayout(defaults)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) {
    return <div className="min-h-[800px] w-full" aria-hidden />
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Drag headers to move · Drag edges to resize
        </p>
        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Layout
        </button>
        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={() => setLocked((l) => !l)}
          className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            locked
              ? "text-amber-400 hover:text-amber-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {locked ? "Unlock Layout" : "Lock Layout"}
        </button>
      </div>

      <ReactGridLayout
        className="analysis-grid"
        layout={layout}
        cols={12}
        rowHeight={40}
        margin={[2, 2]}
        containerPadding={[0, 0]}
        draggableHandle=".widget-drag-handle"
        onLayoutChange={handleChange}
        compactType={null}
        preventCollision={true}
        isResizable={!locked}
        isDraggable={!locked}
        resizeHandles={ALL_HANDLES}
      >
        {widgets.map((w) => (
          <div key={w.id} className="overflow-hidden">
            <WidgetFrame title={w.title}>{w.content}</WidgetFrame>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  )
}
