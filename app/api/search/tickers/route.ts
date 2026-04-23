import { NextResponse } from "next/server"
import { searchTickers } from "@/lib/polygon"

export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  if (q.length < 1) return NextResponse.json({ results: [] })
  const results = await searchTickers(q, 8)
  return NextResponse.json({ results })
}
