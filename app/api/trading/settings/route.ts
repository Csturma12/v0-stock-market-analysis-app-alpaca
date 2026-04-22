import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from("trading_settings").select("*").eq("id", 1).maybeSingle()
  return Response.json({
    settings: data ?? {
      id: 1,
      autonomous_enabled: false,
      kill_switch: false,
      max_position_usd: 1000,
      max_daily_loss_usd: 500,
      min_conviction: 7,
    },
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trading_settings")
    .upsert({ id: 1, ...body, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ settings: data })
}
