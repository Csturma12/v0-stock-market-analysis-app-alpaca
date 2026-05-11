import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const BASE = "https://api.unusualwhales.com/api"
function headers() {
  const key = process.env.UNUSUAL_WHALES_API_KEY
  if (!key) throw new Error("UNUSUAL_WHALES_API_KEY is not set")
  return { Authorization: `Bearer ${key}`, Accept: "application/json" }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [flowRes, histRes, intradayRes] = await Promise.all([
      fetch(`${BASE}/option-contract/${id}/flow`, { headers: headers(), next: { revalidate: 60 } }),
      fetch(`${BASE}/option-contract/${id}/historic`, { headers: headers(), next: { revalidate: 60 } }),
      fetch(`${BASE}/option-contract/${id}/intraday`, { headers: headers(), next: { revalidate: 60 } }),
    ])

    const flow = flowRes.ok ? (await flowRes.json()).data ?? [] : []
    const historic = histRes.ok ? (await histRes.json()).data ?? [] : []
    const intraday = intradayRes.ok ? (await intradayRes.json()).data ?? [] : []

    return NextResponse.json({ flow, historic, intraday })
  } catch (err) {
    console.error("[v0] contract route error", err)
    return NextResponse.json({ flow: [], historic: [], intraday: [] }, { status: 500 })
  }
}
