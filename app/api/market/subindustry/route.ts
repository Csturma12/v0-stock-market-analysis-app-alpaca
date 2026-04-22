import { NextResponse } from "next/server"
import { getSubIndustry } from "@/lib/constants"
import { getSnapshotBatch } from "@/lib/polygon"

export const revalidate = 60

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sector = url.searchParams.get("sector") ?? ""
  const sub = url.searchParams.get("sub") ?? ""
  const ctx = getSubIndustry(sector, sub)
  if (!ctx?.sub) return NextResponse.json({ error: "not found" }, { status: 404 })
  const snaps = await getSnapshotBatch(ctx.sub.tickers)
  return NextResponse.json({ tickers: snaps, updatedAt: new Date().toISOString() })
}
