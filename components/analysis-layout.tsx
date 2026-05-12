"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout"
import {
  RotateCcw, Lock, Unlock, LayoutGrid, Save, Trash2, ChevronDown, Check, Plus, Eye, EyeOff,
  LineChart, Brain, Calculator, TrendingUp, Search, Zap,
} from "lucide-react"
import { WidgetFrame } from "./widget-frame"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  hiddenWidgets: string[]
  createdAt: number
}

// Template presets - which widgets to show for each analysis type
// Each template is optimized for its specific trading/analysis workflow
const TEMPLATE_PRESETS: Record<string, { 
  name: string; 
  icon: typeof LineChart; 
  widgets: string[]; 
  description: string;
  layouts?: Record<string, { x: number; y: number; w: number; h: number }>;
}> = {
  "all": {
    name: "All Widgets",
    icon: LayoutGrid,
    description: "Show all available widgets",
    widgets: [], // Empty = all
  },
  "analyst": {
    name: "Analyst Analysis",
    icon: LineChart,
    description: "Analyst ratings, price targets, and recommendations",
    widgets: ["chart", "analyst-ratings", "key-metrics", "fundamentals", "earnings-history", "news", "insider-activity", "etf-exposure"],
    layouts: {
      "chart": { x: 0, y: 0, w: 8, h: 12 },
      "analyst-ratings": { x: 8, y: 0, w: 4, h: 12 },
      "key-metrics": { x: 0, y: 12, w: 3, h: 8 },
      "fundamentals": { x: 3, y: 12, w: 3, h: 8 },
      "earnings-history": { x: 6, y: 12, w: 3, h: 8 },
      "news": { x: 9, y: 12, w: 3, h: 8 },
      "insider-activity": { x: 0, y: 20, w: 6, h: 8 },
      "etf-exposure": { x: 6, y: 20, w: 6, h: 8 },
    },
  },
  "ai": {
    name: "AI Analysis",
    icon: Brain,
    description: "AI-powered trade ideas, patterns, and catalysts",
    widgets: ["chart", "trade-idea", "patterns", "catalysts", "technicals", "news", "support-resistance"],
    layouts: {
      "chart": { x: 0, y: 0, w: 7, h: 12 },
      "trade-idea": { x: 7, y: 0, w: 5, h: 12 },
      "patterns": { x: 0, y: 12, w: 4, h: 10 },
      "catalysts": { x: 4, y: 12, w: 4, h: 10 },
      "technicals": { x: 8, y: 12, w: 4, h: 10 },
      "support-resistance": { x: 0, y: 22, w: 6, h: 8 },
      "news": { x: 6, y: 22, w: 6, h: 8 },
    },
  },
  "fundamentals": {
    name: "Fundamentals & Technicals",
    icon: Calculator,
    description: "Company financials and technical indicators",
    widgets: ["chart", "fundamentals", "key-metrics", "earnings-history", "technicals", "support-resistance", "short-interest", "analyst-ratings"],
    layouts: {
      "chart": { x: 0, y: 0, w: 8, h: 12 },
      "technicals": { x: 8, y: 0, w: 4, h: 6 },
      "support-resistance": { x: 8, y: 6, w: 4, h: 6 },
      "fundamentals": { x: 0, y: 12, w: 4, h: 10 },
      "key-metrics": { x: 4, y: 12, w: 4, h: 10 },
      "earnings-history": { x: 8, y: 12, w: 4, h: 10 },
      "short-interest": { x: 0, y: 22, w: 6, h: 8 },
      "analyst-ratings": { x: 6, y: 22, w: 6, h: 8 },
    },
  },
  "options": {
    name: "Options Trading",
    icon: TrendingUp,
    description: "Options flow, GEX, volatility, and dark pool",
    widgets: ["chart", "options-blocks", "gex", "volatility", "contract-drill-down", "equity-blocks", "short-interest"],
    layouts: {
      "chart": { x: 0, y: 0, w: 6, h: 12 },
      "gex": { x: 6, y: 0, w: 3, h: 12 },
      "volatility": { x: 9, y: 0, w: 3, h: 12 },
      "options-blocks": { x: 0, y: 12, w: 6, h: 12 },
      "contract-drill-down": { x: 6, y: 12, w: 6, h: 12 },
      "equity-blocks": { x: 0, y: 24, w: 6, h: 10 },
      "short-interest": { x: 6, y: 24, w: 6, h: 10 },
    },
  },
  "research": {
    name: "Market Research",
    icon: Search,
    description: "ETF exposure, insider activity, and research",
    widgets: ["chart", "news", "etf-exposure", "insider-activity", "analyst-ratings", "fundamentals", "catalysts", "earnings-history"],
    layouts: {
      "chart": { x: 0, y: 0, w: 6, h: 10 },
      "news": { x: 6, y: 0, w: 6, h: 10 },
      "etf-exposure": { x: 0, y: 10, w: 4, h: 10 },
      "insider-activity": { x: 4, y: 10, w: 4, h: 10 },
      "analyst-ratings": { x: 8, y: 10, w: 4, h: 10 },
      "fundamentals": { x: 0, y: 20, w: 4, h: 8 },
      "catalysts": { x: 4, y: 20, w: 4, h: 8 },
      "earnings-history": { x: 8, y: 20, w: 4, h: 8 },
    },
  },
  "daytrading": {
    name: "Day Trading",
    icon: Zap,
    description: "Real-time flow, GEX, technicals, S/R levels",
    widgets: ["chart", "technicals", "support-resistance", "gex", "equity-blocks", "options-blocks", "volatility"],
    layouts: {
      "chart": { x: 0, y: 0, w: 8, h: 14 },
      "technicals": { x: 8, y: 0, w: 4, h: 7 },
      "support-resistance": { x: 8, y: 7, w: 4, h: 7 },
      "gex": { x: 0, y: 14, w: 4, h: 10 },
      "volatility": { x: 4, y: 14, w: 4, h: 10 },
      "equity-blocks": { x: 8, y: 14, w: 4, h: 10 },
      "options-blocks": { x: 0, y: 24, w: 12, h: 10 },
    },
  },
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

  // Initialize with defaults immediately, not empty array
  const [layout, setLayout] = useState<Layout[]>(() => 
    widgets.map((w) => ({
      i: w.id,
      ...w.defaultLayout,
      resizeHandles: ALL_HANDLES,
    }))
  )
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [locked, setLocked] = useState(true) // Default to locked
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([])
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<string>("all")
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
      } else {
        // No saved layout - use defaults from widgets
        setLayout(defaults)
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

      // Load hidden widgets
      const hiddenRaw = localStorage.getItem(`${storageKey}:hidden`)
      if (hiddenRaw) {
        setHiddenWidgets(new Set(JSON.parse(hiddenRaw)))
      }

      // Load active template
      const templateRaw = localStorage.getItem(`${storageKey}:template`)
      if (templateRaw) {
        setActiveTemplate(templateRaw)
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [widgets, storageKey, savedLayoutsKey])

  // Persist hidden widgets
  const persistHiddenWidgets = (hidden: Set<string>) => {
    try {
      localStorage.setItem(`${storageKey}:hidden`, JSON.stringify([...hidden]))
    } catch {
      /* ignore */
    }
  }

  const handleHideWidget = (widgetId: string) => {
    const next = new Set(hiddenWidgets)
    next.add(widgetId)
    setHiddenWidgets(next)
    persistHiddenWidgets(next)
  }

  const handleShowWidget = (widgetId: string) => {
    const next = new Set(hiddenWidgets)
    next.delete(widgetId)
    setHiddenWidgets(next)
    persistHiddenWidgets(next)
  }

  const handleApplyTemplate = (templateKey: string) => {
    const template = TEMPLATE_PRESETS[templateKey]
    if (!template) return

    setActiveTemplate(templateKey)
    
    if (templateKey === "all") {
      // Show all widgets with default layout
      setHiddenWidgets(new Set())
      persistHiddenWidgets(new Set())
      setLayout(defaults)
      try {
        localStorage.setItem(storageKey, JSON.stringify(defaults))
      } catch {
        /* ignore */
      }
    } else {
      // Hide widgets not in the template
      const toShow = new Set(template.widgets)
      const toHide = new Set(widgets.filter((w) => !toShow.has(w.id)).map((w) => w.id))
      setHiddenWidgets(toHide)
      persistHiddenWidgets(toHide)
      
      // Apply template-specific layouts if available
      if (template.layouts) {
        const newLayout = widgets.map((w) => {
          const templateLayout = template.layouts?.[w.id]
          return {
            i: w.id,
            ...w.defaultLayout,
            ...(templateLayout ?? {}),
            resizeHandles: ALL_HANDLES,
          }
        })
        setLayout(newLayout)
        try {
          localStorage.setItem(storageKey, JSON.stringify(newLayout))
        } catch {
          /* ignore */
        }
      }
    }

    try {
      localStorage.setItem(`${storageKey}:template`, templateKey)
    } catch {
      /* ignore */
    }
  }

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
    setHiddenWidgets(new Set())
    setActiveTemplate("all")
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}:active`)
      localStorage.removeItem(`${storageKey}:hidden`)
      localStorage.removeItem(`${storageKey}:template`)
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
      hiddenWidgets: [...hiddenWidgets],
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
    
    // Load hidden widgets from saved layout
    const hidden = new Set(savedLayout.hiddenWidgets ?? [])
    setHiddenWidgets(hidden)
    setActiveTemplate("all") // Clear template when loading a saved layout

    try {
      localStorage.setItem(storageKey, JSON.stringify(merged))
      localStorage.setItem(`${storageKey}:active`, savedLayout.id)
      persistHiddenWidgets(hidden)
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
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {/* Template Presets Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border bg-card font-mono text-xs"
            >
              {(() => {
                const T = TEMPLATE_PRESETS[activeTemplate]
                const Icon = T?.icon ?? LayoutGrid
                return <Icon className="h-3.5 w-3.5" />
              })()}
              <span className="hidden sm:inline">{TEMPLATE_PRESETS[activeTemplate]?.name ?? "All"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Analysis Templates
            </DropdownMenuLabel>
            {Object.entries(TEMPLATE_PRESETS).map(([key, preset]) => {
              const Icon = preset.icon
              return (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => handleApplyTemplate(key)}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground">{preset.description}</span>
                  </div>
                  {activeTemplate === key && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              )
            })}
            
            <DropdownMenuSeparator />
            
            {/* Widget visibility submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" />
                <span>Toggle Widgets</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 max-h-80 overflow-y-auto">
                {widgets.map((w) => (
                  <DropdownMenuItem
                    key={w.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      if (hiddenWidgets.has(w.id)) {
                        handleShowWidget(w.id)
                      } else {
                        handleHideWidget(w.id)
                      }
                    }}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    {hiddenWidgets.has(w.id) ? (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-green-500" />
                    )}
                    <span className={hiddenWidgets.has(w.id) ? "text-muted-foreground" : ""}>{w.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

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
        layout={layout.filter((l) => !hiddenWidgets.has(l.i))}
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
        {widgets
          .filter((w) => !hiddenWidgets.has(w.id))
          .map((w) => {
            const l = layout.find((lay) => lay.i === w.id) ?? w.defaultLayout
            return (
              <div 
                key={w.id} 
                className="overflow-hidden"
                data-grid={{ x: l.x, y: l.y, w: l.w, h: l.h }}
              >
                <WidgetFrame
                  title={w.title}
                  showClose={!locked}
                  onClose={() => handleHideWidget(w.id)}
                >
                  {w.content}
                </WidgetFrame>
              </div>
            )
          })}
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
