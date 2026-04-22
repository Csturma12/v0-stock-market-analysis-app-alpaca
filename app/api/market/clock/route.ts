import { NextResponse } from "next/server"
import { getClock } from "@/lib/alpaca"

export async function GET() {
  try {
    const c = await getClock()
    return NextResponse.json(c)
  } catch {
    // Fallback: approximate NYSE hours (Mon–Fri 9:30–16:00 ET)
    const now = new Date()
    const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
    const day = et.getDay()
    const mins = et.getHours() * 60 + et.getMinutes()
    const isWeekday = day >= 1 && day <= 5
    const isMarketHours = mins >= 570 && mins < 960
    return NextResponse.json({ is_open: isWeekday && isMarketHours })
  }
}
