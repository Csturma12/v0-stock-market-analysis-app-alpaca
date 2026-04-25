import { NextRequest, NextResponse } from "next/server"
import { placeOrder, getQuote, isConfigured, type PlaceOrderParams } from "@/lib/tradier"

export const dynamic = "force-dynamic"

type ExecuteRequest = {
  type: "stock" | "option"
  symbol: string
  action: "buy" | "sell" | "buy_to_open" | "buy_to_close" | "sell_to_open" | "sell_to_close"
  quantity: number
  orderType: "market" | "limit" | "stop" | "stop_limit"
  limitPrice?: number
  stopPrice?: number
  duration?: "day" | "gtc"
  optionSymbol?: string
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Tradier not configured" }, { status: 400 })
  }

  try {
    const body: ExecuteRequest = await req.json()

    // Validate required fields
    if (!body.symbol || !body.action || !body.quantity || !body.orderType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current quote for reference
    const quote = await getQuote(body.symbol)

    // Build order params
    const orderParams: PlaceOrderParams = {
      symbol: body.symbol.toUpperCase(),
      side: body.action,
      quantity: body.quantity,
      type: body.orderType,
      duration: body.duration || "day",
      class: body.type === "option" ? "option" : "equity",
    }

    if (body.limitPrice) orderParams.price = body.limitPrice
    if (body.stopPrice) orderParams.stop = body.stopPrice
    if (body.optionSymbol) orderParams.option_symbol = body.optionSymbol

    const result = await placeOrder(orderParams)

    if (!result) {
      return NextResponse.json({ error: "Order failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: result,
      quote: {
        symbol: body.symbol,
        price: quote?.last,
        bid: quote?.bid,
        ask: quote?.ask,
      },
    })
  } catch (err: any) {
    console.error("[Tradier Execute] Error:", err)
    return NextResponse.json({ error: err.message || "Execution failed" }, { status: 500 })
  }
}
