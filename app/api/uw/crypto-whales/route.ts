import { NextResponse } from "next/server"
import { getCryptoWhales } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getCryptoWhales()
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
