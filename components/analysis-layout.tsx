"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout"
import {
  RotateCcw, Lock, Unlock, LayoutGrid, Save, Trash2, ChevronDown, Check, Plus,
} from "lucide-react"
import { WidgetFrame } from "./widget-frame"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

type SavedLayout = {
  id: string
  name: string
  layout: Layout[]
  createdAt: number
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
  const savedLayoutsKey = `${storageKey}:saved`

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
  const [locked, setLocked] = useState(true) // Default to locked
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([])
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState("")

  // Load saved layout on mount
  useEffect(() => {
    try {
      // Load current layout
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

      // Load saved layouts list
      const savedRaw = localStorage.getItem(savedLayoutsKey)
      if (savedRaw) {
        setSavedLayouts(JSON.parse(savedRaw))
      }

      // Load active layout id
      const activeRaw = localStorage.getItem(`${storageKey}:active`)
      if (activeRaw) {
        setActiveLayoutId(activeRaw)
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [widgets, storageKey, savedLayoutsKey])

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
    setActiveLayoutId(null)
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}:active`)
    } catch {
      /* ignore */
    }
  }

  const handleSaveLayout = () => {
    if (!newLayoutName.trim()) return

    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name: newLayoutName.trim(),
      layout: layout.map((l) => ({ ...l })),
      createdAt: Date.now(),
    }

    const updated = [...savedLayouts, newLayout]
    setSavedLayouts(updated)
    setActiveLayoutId(newLayout.id)

    try {
      localStorage.setItem(savedLayoutsKey, JSON.stringify(updated))
      localStorage.setItem(`${storageKey}:active`, newLayout.id)
    } catch {
      /* ignore */
    }

    setNewLayoutName("")
    setSaveDialogOpen(false)
  }

  const handleLoadLayout = (savedLayout: SavedLayout) => {
    const merged = widgets.map((w) => {
      const found = savedLayout.layout.find((s) => s.i === w.id)
      return {
        i: w.id,
        ...w.defaultLayout,
        ...(found ?? {}),
        resizeHandles: ALL_HANDLES,
      }
    })
    setLayout(merged)
    setActiveLayoutId(savedLayout.id)

    try {
      localStorage.setItem(storageKey, JSON.stringify(merged))
      localStorage.setItem(`${storageKey}:active`, savedLayout.id)
    } catch {
      /* ignore */
    }
  }

  const handleDeleteLayout = (id: string) => {
    const updated = savedLayouts.filter((l) => l.id !== id)
    setSavedLayouts(updated)

    if (activeLayoutId === id) {
      setActiveLayoutId(null)
      try {
        localStorage.removeItem(`${storageKey}:active`)
      } catch {
        /* ignore */
      }
    }

    try {
      localStorage.setItem(savedLayoutsKey, JSON.stringify(updated))
    } catch {
      /* ignore */
    }
  }

  const activeLayoutName = savedLayouts.find((l) => l.id === activeLayoutId)?.name ?? "Default"

  if (!hydrated) {
    return <div className="min-h-[800px] w-full" aria-hidden />
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2">
        {/* Layout Manager Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border bg-card font-mono text-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{activeLayoutName}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Saved Layouts
            </DropdownMenuLabel>

            {/* Default layout */}
            <DropdownMenuItem
              onSelect={() => handleReset()}
              className="flex cursor-pointer items-center justify-between"
            >
              <span>Default</span>
              {activeLayoutId === null && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>

            {/* Saved layouts */}
            {savedLayouts.map((sl) => (
              <div
                key={sl.id}
                className="flex items-center justify-between gap-1 px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleLoadLayout(sl)}
                  className="flex flex-1 items-center gap-2 text-sm hover:text-foreground"
                >
                  <span className="truncate">{sl.name}</span>
                  {activeLayoutId === sl.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteLayout(sl.id)
                  }}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  aria-label={`Delete ${sl.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            <DropdownMenuSeparator />

            {/* Save current layout */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setSaveDialogOpen(true)
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Current Layout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Layout toggle */}
        <Button
          variant={locked ? "outline" : "default"}
          size="sm"
          onClick={() => setLocked((l) => !l)}
          className={`h-8 gap-1.5 font-mono text-xs ${
            locked
              ? "border-border bg-card"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
          }`}
        >
          {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{locked ? "Edit Layout" : "Editing..."}</span>
        </Button>

        {/* Reset button - only show when editing */}
        {!locked && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 border-border bg-card font-mono text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}

        {/* Save button - only show when editing */}
        {!locked && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="h-8 gap-1.5 border-border bg-card font-mono text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}

        {/* Instruction text when editing */}
        {!locked && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground ml-2">
            Drag headers to move · Drag edges to resize
          </p>
        )}
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

      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Layout</DialogTitle>
            <DialogDescription>
              Give your layout a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="layout-name" className="text-xs">
                Layout Name
              </Label>
              <Input
                id="layout-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="e.g., Trading Focus, Research View"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveLayout()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveLayout} disabled={!newLayoutName.trim()}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
