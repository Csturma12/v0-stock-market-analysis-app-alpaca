import { NextResponse } from "next/server"
import { getAccounts, getOpenOrders, getOrderHistory, placeOrder, cancelOrder } from "@/lib/webull"

export const dynamic = "force-dynamic"

// GET open orders or order history
export async function GET(req: Request) {
  const url = new URL(req.url)
  let accountId = url.searchParams.get("account_id")
  const history = url.searchParams.get("history") === "true"

  try {
    if (!accountId) {
      const accounts = await getAccounts()
      if (accounts.length === 0) {
        return NextResponse.json({ data: [], error: "No accounts found" })
      }
      accountId = accounts[0].account_id
    }

    const orders = history
      ? await getOrderHistory(accountId)
      : await getOpenOrders(accountId)

    return NextResponse.json({ data: orders, account_id: accountId })
  } catch (err) {
    console.error("[Webull Orders GET]", err)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST place a new order
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { account_id, symbol, side, order_type, time_in_force, qty, limit_price, stop_price } = body

    if (!account_id || !symbol || !side || !order_type || !qty) {
      return NextResponse.json(
        { error: "Missing required fields: account_id, symbol, side, order_type, qty" },
        { status: 400 }
      )
    }

    const order = await placeOrder({
      account_id,
      symbol,
      side,
      order_type,
      time_in_force: time_in_force || "DAY",
      qty,
      limit_price,
      stop_price,
    })

    if (!order) {
      return NextResponse.json({ error: "Failed to place order" }, { status: 500 })
    }

    return NextResponse.json({ data: order })
  } catch (err) {
    console.error("[Webull Orders POST]", err)
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 })
  }
}

// DELETE cancel an order
export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const accountId = url.searchParams.get("account_id")
  const orderId = url.searchParams.get("order_id")

  if (!accountId || !orderId) {
    return NextResponse.json(
      { error: "Missing required params: account_id, order_id" },
      { status: 400 }
    )
  }

  try {
    const success = await cancelOrder(accountId, orderId)
    if (!success) {
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Webull Orders DELETE]", err)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}
