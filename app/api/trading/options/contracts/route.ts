import { searchOptionContracts } from "@/lib/alpaca"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const underlying = url.searchParams.get("underlying") ?? ""
  const type = (url.searchParams.get("type") ?? "") as "call" | "put" | ""
  const expGte = url.searchParams.get("expiration_gte") ?? ""
  const expLte = url.searchParams.get("expiration_lte") ?? ""
  const strikeGte = url.searchParams.get("strike_gte") ?? ""
  const strikeLte = url.searchParams.get("strike_lte") ?? ""

  if (!underlying) return Response.json({ error: "underlying required" }, { status: 400 })

  try {
    const contracts = await searchOptionContracts({
      underlying_symbol: underlying.toUpperCase(),
      ...(type ? { type } : {}),
      ...(expGte ? { expiration_date_gte: expGte } : {}),
      ...(expLte ? { expiration_date_lte: expLte } : {}),
      ...(strikeGte ? { strike_price_gte: strikeGte } : {}),
      ...(strikeLte ? { strike_price_lte: strikeLte } : {}),
      limit: 40,
    })
    return Response.json({ contracts })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
