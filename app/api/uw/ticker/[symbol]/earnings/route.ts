import { NextResponse } from "next/server"
import { getEarningsHistory } from "@/lib/unusual-whales"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getEarningsHistory(symbol)
  return NextResponse.json(data)
}
