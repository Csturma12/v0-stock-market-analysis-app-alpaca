import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function authedClient() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { supabase, user: error ? null : data.user ?? null }
}

export async function GET() {
  const { supabase, user } = await authedClient()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .select("watchlists, layouts, hidden_widgets, collapsed_widgets, templates")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ preferences: data ?? {} })
}

export async function POST(req: Request) {
  const { supabase, user } = await authedClient()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const payload = {
    user_id: user.id,
    watchlists: body.watchlists ?? null,
    layouts: body.layouts ?? null,
    hidden_widgets: body.hiddenWidgets ?? null,
    collapsed_widgets: body.collapsedWidgets ?? null,
    templates: body.templates ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("watchlists, layouts, hidden_widgets, collapsed_widgets, templates")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ preferences: data })
}
