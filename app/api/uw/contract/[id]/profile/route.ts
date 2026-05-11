import { NextResponse } from "next/server"

const BASE = "https://api.unusualwhales.com/api"

function headers() {
  const key = process.env.UNUSUAL_WHALES_API_KEY
  if (!key) throw new Error("UNUSUAL_WHALES_API_KEY is not set")
  return {
    Authorization: `Bearer ${key}`,
    "UW-CLIENT-API-ID": "100001",
    Accept: "application/json",
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const res = await fetch(`${BASE}/option-contract/${id}/volume-profile`, {
      headers: headers(),
      next: { revalidate: 300 },
    })
    
    if (!res.ok) return NextResponse.json([])
    
    const json = await res.json()
    const data = (json?.data ?? []).map((d: any) => ({
      price: Number(d.price ?? d.strike ?? 0),
      volume: Number(d.volume ?? d.total_volume ?? 0),
    }))
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
