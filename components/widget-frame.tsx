"use client"

import type { ReactNode } from "react"
import { GripHorizontal, X } from "lucide-react"

type WidgetFrameProps = {
  title: string
  children: ReactNode
  onClose?: () => void
  showClose?: boolean
}

/**
 * Thin pill-box wrapper for an analysis widget.
 *
 * Each underlying widget already supplies its own card chrome (border,
 * background, title), so this frame just provides a small drag-handle
 * strip at the top — matched by react-grid-layout via `.widget-drag-handle`.
 * The body fills the rest of the cell with its own scroll container.
 */
export function WidgetFrame({ title, children, onClose, showClose = false }: WidgetFrameProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        title={`Drag to move · ${title}`}
        aria-label={`Drag to move ${title}`}
        className="widget-drag-handle group flex h-4 shrink-0 cursor-move items-center justify-between rounded-t-md bg-muted/30 px-1 transition-colors hover:bg-muted/60"
      >
        <div className="flex-1" />
        <GripHorizontal className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
        <div className="flex flex-1 justify-end">
          {showClose && onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${title} widget`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}
