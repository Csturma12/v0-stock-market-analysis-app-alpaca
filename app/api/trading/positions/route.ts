import { NextResponse } from "next/server"
import { getPositions } from "@/lib/alpaca"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const positions = await getPositions()
    return NextResponse.json({ positions })
  } catch (err: any) {
    console.error("[trading/positions] Error:", err.message)
    return NextResponse.json(
      { positions: [], error: err.message },
      { status: 200 } // Return 200 with empty array so UI doesn't break
    )
  }
}
