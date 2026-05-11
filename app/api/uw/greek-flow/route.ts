import { NextResponse } from "next/server"
import { uw } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const group = searchParams.get("group") ?? "all"
    const data = await uw().greekFlow(group)
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
