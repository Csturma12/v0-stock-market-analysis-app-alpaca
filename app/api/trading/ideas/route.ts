import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0

export async function GET() {
  try {
    const { data: ideas, error } = await supabase
      .from("trade_ideas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ ideas: ideas ?? [] })
  } catch (e: any) {
    console.error("[ideas] Error:", e.message)
    return NextResponse.json({ ideas: [], error: e.message }, { status: 500 })
  }
}
