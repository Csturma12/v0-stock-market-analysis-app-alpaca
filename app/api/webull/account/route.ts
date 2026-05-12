import { NextResponse } from "next/server"
import { isAuthenticated, getAccountBalance, getPrimaryAccountSummary } from "@/lib/webull"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Check if Webull OAuth is completed
  if (!isAuthenticated()) {
    return NextResponse.json({ 
      error: "Webull not authenticated - complete OAuth login to connect your account",
      needsAuth: true 
    }, { status: 401 })
  }

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
  } catch (err: any) {
    console.error("[Webull Account]", err)
    
    // Check if it's an auth error
    if (err.message?.includes("not authenticated") || err.message?.includes("OAuth")) {
      return NextResponse.json({ 
        error: err.message,
        needsAuth: true 
      }, { status: 401 })
    }
    
    return NextResponse.json({ error: err.message || "Failed to fetch account" }, { status: 500 })
  }
}
