import { NextResponse } from "next/server"
import { SECTORS } from "@/lib/constants"
import { getSnapshot } from "@/lib/polygon"

export const revalidate = 60

export async function GET() {
  const results = await Promise.all(
    SECTORS.map(async (s) => {
      const snap = await getSnapshot(s.etf)
      const price = snap?.price ?? null
      const prev = snap?.prevClose ?? null
      const change = price != null && prev != null ? price - prev : null
      return {
        id: s.id,
        name: s.name,
        etf: s.etf,
        description: s.description,
        subCount: s.subIndustries.length,
        price,
        change,
        changePct: snap?.changePct ?? null,
        volume: snap?.volume ?? null,
      }
    }),
  )
  // Return both keys so every caller is happy
  return NextResponse.json({ data: results, sectors: results, updatedAt: new Date().toISOString() })
}
