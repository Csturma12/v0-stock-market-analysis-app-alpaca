import { NextResponse } from "next/server"
import { getAccounts, getPositions } from "@/lib/webull"
import { getQuotes } from "@/lib/tradier"
import { getSnapshotBatch } from "@/lib/polygon"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  let accountId = url.searchParams.get("account_id")

  try {
    // If no account_id provided, get the first account
    if (!accountId) {
      const accounts = await getAccounts()
      if (accounts.length === 0) {
        return NextResponse.json({ data: [], error: "No accounts found" })
      }
      accountId = accounts[0].account_id
    }

    const positions = await getPositions(accountId)
    const symbols = [...new Set(positions.map((p) => p.symbol).filter((s): s is string => Boolean(s)))]

    const quoteMap = new Map<string, number>()
    if (symbols.length > 0) {
      try {
        const tradierQuotes = await getQuotes(symbols)
        for (const quote of tradierQuotes) {
          if (quote.last != null) quoteMap.set(quote.symbol.toUpperCase(), quote.last)
        }
      } catch {
        // ignore and fall back below
      }

      if (quoteMap.size === 0) {
        const snapshots = await getSnapshotBatch(symbols)
        for (const snap of snapshots) {
          if (snap.price != null) quoteMap.set(snap.ticker.toUpperCase(), snap.price)
        }
      }
    }

    const enriched = positions.map((position) => {
      const symbol = position.symbol?.toUpperCase() ?? ""
      const fallback = symbol ? quoteMap.get(symbol) ?? null : null
      return {
        ...position,
        last_price: position.last_price ?? fallback ?? undefined,
      }
    })

    return NextResponse.json({ data: enriched, account_id: accountId })
  } catch (err) {
    console.error("[Webull Positions]", err)
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 })
  }
}
