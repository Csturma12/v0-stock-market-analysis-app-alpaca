import { cancelOrder } from "@/lib/alpaca"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const ok = await cancelOrder(id)
    if (!ok) return Response.json({ error: "Cancel failed" }, { status: 400 })
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: e.message ?? "Cancel failed" }, { status: 400 })
  }
}
