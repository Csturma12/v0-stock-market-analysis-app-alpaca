import { NextResponse } from "next/server"
import { isConfigured, getAccountBalance, getPrimaryAccountSummary } from "@/lib/webull"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Check if Webull credentials are configured
  if (!isConfigured()) {
    return NextResponse.json({ 
      error: "Webull not configured - add WEBULL_APP_KEY and WEBULL_APP_SECRET",
      needsConfig: true 
    }, { status: 401 })
  }

  const url = new URL(req.url)
  const accountId = url.searchParams.get("account_id")

  try {
    if (accountId) {
      const balance = await getAccountBalance(accountId)
      if (!balance) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 })
      }
      return NextResponse.json({ data: balance })
    }

    // Get primary account summary
    const summary = await getPrimaryAccountSummary()
    if (!summary) {
      return NextResponse.json({ error: "No Webull accounts found" }, { status: 404 })
    }
    return NextResponse.json({ data: summary })
  } catch (err: any) {
    console.error("[Webull Account]", err)
    return NextResponse.json({ error: err.message || "Failed to fetch account" }, { status: 500 })
  }
}
