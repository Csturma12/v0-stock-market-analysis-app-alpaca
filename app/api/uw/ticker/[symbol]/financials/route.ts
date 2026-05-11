import { NextResponse } from "next/server"
import { getFinancials } from "@/lib/unusual-whales"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await getFinancials(symbol)
  return NextResponse.json({ data })
}
