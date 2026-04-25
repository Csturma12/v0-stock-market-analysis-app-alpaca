import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { SiteNav } from "@/components/site-nav"
import { StagedTradeProvider } from "@/lib/staged-trade-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Market Intel — Sector & Ticker Deep Research",
  description:
    "Autonomous market research and paper-trading terminal. Sector heatmap, AI analysis, news aggregation, and Alpaca execution.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <StagedTradeProvider>
          <SiteNav />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <Toaster theme="dark" />
          {process.env.NODE_ENV === "production" && <Analytics />}
        </StagedTradeProvider>
      </body>
    </html>
  )
}
