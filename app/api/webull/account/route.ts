import { NextResponse } from "next/server"
import { getAccounts, getAccountBalance, getPrimaryAccountSummary } from "@/lib/webull"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const accountId = url.searchParams.get("account_id")

  try {
    if (accountId) {
      // Get specific account balance
      const balance = await getAccountBalance(accountId)
      if (!balance) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 })
      }
      return NextResponse.json({ data: balance })
    }

    // Get primary account summary (first account with balance + positions)
    const summary = await getPrimaryAccountSummary()
    if (!summary) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 })
    }
    return NextResponse.json({ data: summary })
  } catch (err) {
    console.error("[Webull Account]", err)
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}
