import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Sparkles, Scale } from "lucide-react"
import { getTheme, THEMES } from "@/lib/themes"
import { ThemePageContent } from "@/components/theme-page-content"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const ACCENT_ICON_COLOR: Record<string, string> = {
  primary: "text-primary",
  bull: "text-[color:var(--color-bull)]",
  bear: "text-[color:var(--color-bear)]",
  warning: "text-amber-400",
}

export function generateStaticParams() {
  return THEMES.map((t) => ({ id: t.id }))
}

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const theme = getTheme(id)
  if (!theme) notFound()

  const Icon = id === "political-ma" ? Scale : Sparkles
  const iconColor = ACCENT_ICON_COLOR[theme.accent] ?? "text-primary"

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Hub
      </Link>

      <header className="mb-10 flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Theme</span>
        <div className="flex items-center gap-3">
          <Icon className={cn("h-8 w-8", iconColor)} />
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{theme.name}</h1>
        </div>
        <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">{theme.description}</p>
      </header>

      <ThemePageContent theme={theme} />
    </main>
  )
}
