export type DashboardPreferences = {
  watchlists?: Record<string, string[]>
  layouts?: Record<string, unknown>
  hiddenWidgets?: string[]
  collapsedWidgets?: string[]
  templates?: Record<string, string>
}

export async function loadDashboardPreferences() {
  const res = await fetch("/api/preferences", { cache: "no-store" })
  if (!res.ok) return null
  return (await res.json()) as { preferences?: DashboardPreferences }
}

export async function saveDashboardPreferences(preferences: DashboardPreferences) {
  const res = await fetch("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  })
  if (!res.ok) return null
  return (await res.json()) as { preferences?: DashboardPreferences }
}
