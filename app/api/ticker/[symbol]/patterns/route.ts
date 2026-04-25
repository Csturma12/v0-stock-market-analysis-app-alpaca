import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getBars } from "@/lib/polygon"
import { detectPatterns, scorePatternForAutonomy } from "@/lib/pattern-detector"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await context.params
    const timeframe = req.nextUrl.searchParams.get("timeframe") || "day" // day or week

    console.log(`[v0] Detecting patterns for ${symbol} (${timeframe})`)

    // Fetch last 40 bars (2+ months of data)
    const bars = await getBars(symbol.toUpperCase(), (timeframe as "day" | "week" | "month") || "day", 40)
    if (!bars || bars.length < 20) {
      return NextResponse.json({ 
        patterns: [], 
        diagnostics: [{ pattern: "All", checked: false, reason: `Only ${bars?.length ?? 0} bars available` }],
        summary: `Insufficient price history (${bars?.length ?? 0} bars). Need 20+ trading days for pattern analysis.`
      }, { status: 200 })
    }

    // Detect patterns
    const result = detectPatterns(bars)
    console.log(`[v0] Found ${result.patterns.length} tradeable patterns`)

    // Score each for autonomous trading
    const scored = result.patterns.map((p) => ({
      ...p,
      autonomyScore: scorePatternForAutonomy(p),
    }))

    // Store patterns in DB
    if (scored.length > 0) {
      const { error } = await supabase.from("stock_patterns").upsert(
        scored.map((p) => ({
          symbol: symbol.toUpperCase(),
          pattern_type: p.type,
          pattern_name: p.name,
          strength: p.strength,
          autonomy_score: p.autonomyScore,
          recommendation: p.recommendation,
          frequency: p.frequency,
          avg_return: p.avgReturn,
          win_rate: p.winRate,
          description: p.description,
          detected_at: new Date().toISOString(),
        })),
        { onConflict: "symbol,pattern_type" },
      )
      if (error) console.log("[v0] DB error:", error.message)
    }

    return NextResponse.json({ 
      symbol, 
      timeframe, 
      patterns: scored,
      diagnostics: result.diagnostics,
      summary: result.summary
    })
  } catch (error) {
    console.error("[v0] Pattern detection error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
