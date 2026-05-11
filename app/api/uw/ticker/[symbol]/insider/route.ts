import { NextResponse } from "next/server"
import { getInsiderTrades } from "@/lib/unusual-whales"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getInsiderTrades(symbol)
  return NextResponse.json(data)
}
