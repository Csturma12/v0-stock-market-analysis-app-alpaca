import { alpaca } from "@/lib/alpaca"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const body = await req.json()
  const { symbol, qty, side, type = "market", limit_price, stop_price, time_in_force = "day", source = "manual" } = body

  // Check guardrails
  const supabase = await createClient()
  const { data: settings } = await supabase.from("trading_settings").select("*").eq("id", 1).maybeSingle()

  if (settings?.kill_switch) {
    return Response.json({ error: "Kill switch is active. All trading blocked." }, { status: 403 })
  }
  if (source === "autonomous" && !settings?.autonomous_enabled) {
    return Response.json({ error: "Autonomous trading is disabled." }, { status: 403 })
  }

  try {
    const order = await alpaca.placeOrder({
      symbol: String(symbol).toUpperCase(),
      qty: Number(qty),
      side,
      type,
      limit_price,
      stop_price,
      time_in_force,
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
    return Response.json({ error: e.message ?? "Order failed" }, { status: 400 })
  }
}
