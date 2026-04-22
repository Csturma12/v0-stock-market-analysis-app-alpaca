import { getAccount, getPositions, getOrders } from "@/lib/alpaca"

export const dynamic = "force-dynamic"

export async function GET() {
  const [account, positions, orders] = await Promise.all([
    getAccount().catch((e: any) => ({ error: e.message as string })),
    getPositions().catch(() => []),
    getOrders("all", 50).catch(() => []),
  ])
  return Response.json({ account, positions, orders })
}
