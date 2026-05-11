import { NextResponse } from "next/server"
import { getMarketInsiderTrades } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200)
    const data = await getMarketInsiderTrades(limit)
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
