import { NextResponse } from "next/server"
import { getFlowSummary } from "@/lib/flashalpha"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getFlowSummary(symbol)
  return NextResponse.json({ data })
}
