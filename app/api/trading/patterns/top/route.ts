import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("stock_patterns")
      .select("*")
      .gte("autonomy_score", 65) // Only high-confidence patterns
      .in("frequency", ["weekly", "monthly"]) // Recurring trades
      .order("autonomy_score", { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ data, count: data?.length })
  } catch (err) {
    console.error("[v0] Top patterns error:", err)
    return NextResponse.json({ error: (err as Error).message, data: [] }, { status: 500 })
  }
}
