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
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
      {/* Drag handle header */}
      <div
        title={`Drag to move · ${title}`}
        aria-label={`Drag to move ${title}`}
        className="widget-drag-handle group flex h-7 shrink-0 cursor-move items-center justify-between border-b border-border/30 bg-muted/20 px-2 transition-colors hover:bg-muted/40"
      >
        <span className="truncate font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <GripHorizontal className="h-3 w-3 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
          {showClose && onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="ml-1 rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${title} widget`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {/* Widget content */}
      <div className="min-h-0 flex-1 overflow-auto p-0">{children}</div>
    </div>
  )
}
