"use client"

import type { ReactNode } from "react"
import { GripHorizontal } from "lucide-react"

type WidgetFrameProps = {
  title: string
  children: ReactNode
}

/**
 * Thin pill-box wrapper for an analysis widget.
 *
 * Each underlying widget already supplies its own card chrome (border,
 * background, title), so this frame just provides a small drag-handle
 * strip at the top — matched by react-grid-layout via `.widget-drag-handle`.
 * The body fills the rest of the cell with its own scroll container.
 */
export function WidgetFrame({ title, children }: WidgetFrameProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        title={`Drag to move · ${title}`}
        aria-label={`Drag to move ${title}`}
        className="widget-drag-handle group flex h-4 shrink-0 cursor-move items-center justify-center rounded-t-md bg-muted/30 transition-colors hover:bg-muted/60"
      >
        <GripHorizontal className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}
