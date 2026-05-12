import { getAccount, getPositions, getOrders } from "@/lib/alpaca"
import { getWebullTradingAccount, hasWebullConfig } from "@/lib/webull"

export const dynamic = "force-dynamic"

export async function GET() {
  if (hasWebullConfig()) {
    const data = await getWebullTradingAccount().catch((e: any) => ({
      account: { error: e.message as string, broker: "webull" },
      positions: [],
    }))

    return Response.json({ ...data, orders: [] })
  }

  const [account, positions, orders] = await Promise.all([
    getAccount().catch((e: any) => ({ error: e.message as string })),
    getPositions().catch(() => []),
    getOrders("all", 50).catch(() => []),
  ])
  return Response.json({ account, positions, orders })
}
