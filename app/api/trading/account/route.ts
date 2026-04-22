import { alpaca } from "@/lib/alpaca"

export const dynamic = "force-dynamic"

export async function GET() {
  const [account, positions, orders] = await Promise.all([
    alpaca.account().catch((e) => ({ error: e.message })),
    alpaca.positions().catch(() => []),
    alpaca.orders("all", 50).catch(() => []),
  ])
  return Response.json({ account, positions, orders })
}
