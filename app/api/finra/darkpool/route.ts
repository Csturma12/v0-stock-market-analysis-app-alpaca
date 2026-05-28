import { NextRequest, NextResponse } from "next/server"
import { getFinraATSSummary } from "@/lib/finra-ats"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const summary = await getFinraATSSummary(symbol.toUpperCase())
  return NextResponse.json({ data: summary })
}
