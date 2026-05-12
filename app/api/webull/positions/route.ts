import { NextResponse } from "next/server"
import { getAccounts, getPositions } from "@/lib/webull"

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
    return NextResponse.json({ data: positions, account_id: accountId })
  } catch (err) {
    console.error("[Webull Positions]", err)
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 })
  }
}
