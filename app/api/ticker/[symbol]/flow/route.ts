import { NextResponse } from "next/server"
import { getUnusualWhalesSummary } from "@/lib/unusual-whales"

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  try {
    const uw = await getUnusualWhalesSummary(symbol)
    return NextResponse.json({ uw })
  } catch (err) {
    console.log("[v0] flow route error", err)
    return NextResponse.json({ uw: null })
  }
}
