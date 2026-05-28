import { NextResponse } from "next/server"
import { getEtfExposure } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getEtfExposure(symbol)
  return NextResponse.json({ data })
}
