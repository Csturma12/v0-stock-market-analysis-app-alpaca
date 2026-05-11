import { NextResponse } from "next/server"
import { getAnalystRatings } from "@/lib/unusual-whales"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getAnalystRatings(symbol)
  return NextResponse.json(data)
}
