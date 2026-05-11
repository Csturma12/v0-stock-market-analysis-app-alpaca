import { NextResponse } from "next/server"
import { getAnalystRatings } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  console.log("[v0] analysts route called for", symbol)
  const data = await getAnalystRatings(symbol)
  console.log("[v0] analysts route got", data?.length ?? 0, "results")
  return NextResponse.json({ data })
}
