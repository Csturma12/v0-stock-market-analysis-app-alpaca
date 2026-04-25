"use client"

import type { ReactNode } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

type AnalysisLayoutProps = {
  chart: ReactNode
  topSidebar: ReactNode
  mainContent: ReactNode
  rightSidebar: ReactNode
}

/**
 * Resizable, persistent layout for the analysis page.
 * Users can drag the dividers to resize each widget area, and the
 * sizes are persisted per-group via `autoSaveId` (localStorage).
 */
export function AnalysisLayout({
  chart,
  topSidebar,
  mainContent,
  rightSidebar,
}: AnalysisLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="vertical"
      autoSaveId="analysis:vertical"
      className="h-[calc(100vh-9rem)] min-h-[640px] w-full rounded-lg border border-border bg-background"
    >
      {/* TOP ROW — chart + primary sidebar */}
      <ResizablePanel defaultSize={62} minSize={30}>
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="analysis:top"
          className="h-full"
        >
          <ResizablePanel defaultSize={72} minSize={35}>
            <div className="h-full w-full">{chart}</div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={28} minSize={18}>
            <div className="h-full overflow-y-auto p-3">
              <div className="flex flex-col gap-4">{topSidebar}</div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* BOTTOM ROW — supporting content + secondary sidebar */}
      <ResizablePanel defaultSize={38} minSize={20}>
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="analysis:bottom"
          className="h-full"
        >
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="h-full overflow-y-auto p-3">
              <div className="flex flex-col gap-4">{mainContent}</div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full overflow-y-auto p-3">
              <div className="flex flex-col gap-4">{rightSidebar}</div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
