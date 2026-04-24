import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0

export async function GET() {
  try {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ trades: trades ?? [] })
  } catch (e: any) {
    console.error("[trades] Error:", e.message)
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
