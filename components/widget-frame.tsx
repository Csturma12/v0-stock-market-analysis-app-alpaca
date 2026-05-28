"use client"

import type { ReactNode } from "react"
import { ChevronDown, ChevronRight, GripHorizontal, X } from "lucide-react"

type WidgetFrameProps = {
  title: string
  children: ReactNode
  onClose?: () => void
  showClose?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

/**
 * Thin pill-box wrapper for an analysis widget.
 *
 * The header doubles as the drag handle. Collapsed widgets become compact
 * one-row pills that keep their grid position and can still be moved.
 */
export function WidgetFrame({
  title,
  children,
  onClose,
  showClose = false,
  collapsed = false,
  onToggleCollapsed,
}: WidgetFrameProps) {
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden border border-border/50 bg-card shadow-sm ${
        collapsed ? "rounded-md" : "rounded-lg"
      }`}
    >
      <div
        title={`Drag to move - ${title}`}
        aria-label={`Drag to move ${title}`}
        className={`widget-drag-handle group flex shrink-0 cursor-move items-center justify-between bg-muted/20 px-2 transition-colors hover:bg-muted/40 ${
          collapsed ? "h-10" : "h-7 border-b border-border/30"
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapsed()
              }}
              className="widget-frame-action rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <span className="truncate font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {collapsed && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary">
              Collapsed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <GripHorizontal className="h-3 w-3 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
          {showClose && onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="widget-frame-action ml-1 rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${title} widget`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div className="min-h-0 flex-1 overflow-auto p-0">{children}</div>}
    </div>
  )
}
