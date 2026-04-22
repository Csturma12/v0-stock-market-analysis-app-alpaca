import { NextResponse } from "next/server"
import { SECTORS } from "@/lib/constants"
import { getSnapshot } from "@/lib/polygon"

export const revalidate = 60

export async function GET() {
  const results = await Promise.all(
    SECTORS.map(async (s) => {
      const snap = await getSnapshot(s.etf)
      return {
        id: s.id,
        name: s.name,
        etf: s.etf,
        description: s.description,
        subCount: s.subIndustries.length,
        price: snap?.price ?? null,
        changePct: snap?.changePct ?? null,
        volume: snap?.volume ?? null,
      }
    }),
  )
  return NextResponse.json({ sectors: results, updatedAt: new Date().toISOString() })
}
