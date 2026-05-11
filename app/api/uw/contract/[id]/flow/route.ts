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
    const res = await fetch(`${BASE}/option-contract/${id}/flow`, {
      headers: headers(),
      next: { revalidate: 60 },
    })
    
    if (!res.ok) return NextResponse.json([])
    
    const json = await res.json()
    const data = (json?.data ?? []).map((t: any) => ({
      time: t.executed_at ?? t.time ?? "",
      price: Number(t.price ?? 0),
      size: Number(t.size ?? t.volume ?? 0),
      side: (t.side ?? "mid").toLowerCase(),
      premium: Number(t.premium ?? Number(t.price ?? 0) * Number(t.size ?? 0) * 100),
    }))
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
