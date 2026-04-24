import { placeOptionOrder } from "@/lib/alpaca"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const body = await req.json()
  const {
    occSymbol,   // full OCC symbol e.g. AAPL240119C00150000
    qty,
    side,
    type = "limit",
    limit_price,
    source = "manual",
  } = body

  if (!occSymbol || !qty || !side) {
    return Response.json({ error: "occSymbol, qty and side are required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: settings } = await supabase.from("trading_settings").select("*").eq("id", 1).maybeSingle()

  if (settings?.kill_switch) {
    return Response.json({ error: "Kill switch is active. All trading blocked." }, { status: 403 })
  }

  try {
    const order = await placeOptionOrder({
      symbol: String(occSymbol).toUpperCase(),
      qty: Number(qty),
      side,
      type,
      limit_price: limit_price ? Number(limit_price) : undefined,
    })

    await supabase.from("trades").insert({
      symbol: order.symbol,
      qty: Number(order.qty),
      side: order.side,
      order_type: order.type,
      status: order.status,
      alpaca_order_id: order.id,
      source,
      submitted_at: new Date().toISOString(),
    })

    return Response.json({ order })
  } catch (e: any) {
    return Response.json({ error: e.message ?? "Options order failed" }, { status: 400 })
  }
}
