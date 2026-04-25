import { NextResponse } from "next/server"
import { getUnusualWhalesSummary } from "@/lib/unusual-whales"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(req.url)
  const period = (searchParams.get("period") as any) || "weekly"

  try {
    const uw = await getUnusualWhalesSummary(symbol, period)
    return NextResponse.json({ uw })
  } catch (err) {
    console.log("[v0] flow route error", err)
    return NextResponse.json({ uw: null })
  }
}
