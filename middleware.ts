import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { PAUSED } from "@/lib/api-pause"

// Intercepts every /api/* request. While PAUSED, no route handler runs,
// so no external API (Polygon, Unusual Whales, Alpaca, Tradier, Finnhub...) is hit.
export function middleware(request: NextRequest) {
  if (PAUSED) {
    return NextResponse.json(
      {
        paused: true,
        error: "API calls are paused",
        message:
          "All outbound API calls are currently paused. Set API_PAUSED=\"false\" (or flip PAUSED in lib/api-pause.ts) to resume.",
      },
      { status: 503 },
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
