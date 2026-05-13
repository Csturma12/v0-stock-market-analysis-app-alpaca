import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      data: [],
      count: 0,
      available: false,
      reason: "Supabase scanner is not configured.",
    })
  }

  try {
    const { data, error } = await getSupabase()
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
    return NextResponse.json({
      data: [],
      count: 0,
      available: false,
      reason: "Supabase scanner data is unavailable.",
      error: (err as Error).message,
    })
  }
}
