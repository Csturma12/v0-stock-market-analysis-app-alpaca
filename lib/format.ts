export function fmtUsd(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export function fmtPct(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—"
  const s = n >= 0 ? "+" : ""
  return `${s}${n.toFixed(digits)}%`
}

export function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n)
}

export function fmtCompact(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n)
}

export function moveClass(change: number | null | undefined) {
  if (change == null || !Number.isFinite(change) || Math.abs(change) < 0.01) return "text-muted-foreground"
  return change > 0 ? "text-primary" : "text-destructive"
}

export function moveBg(change: number | null | undefined) {
  if (change == null || !Number.isFinite(change)) return "bg-muted/40"
  if (change > 3) return "bg-primary/30"
  if (change > 1) return "bg-primary/20"
  if (change > 0) return "bg-primary/10"
  if (change < -3) return "bg-destructive/30"
  if (change < -1) return "bg-destructive/20"
  if (change < 0) return "bg-destructive/10"
  return "bg-muted/40"
}

export function timeAgo(date: string | number | Date) {
  const d = new Date(date).getTime()
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
