import { NextResponse } from "next/server"
import { isConfigured, getAccountBalance, getPrimaryAccountSummary, getTokenStatus } from "@/lib/webull"

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
    
    // Include token status in response
    const tokenStatus = getTokenStatus()
    
    if (!summary) {
      // If no accounts but token is pending, show that status
      if (tokenStatus?.status === "PENDING") {
        return NextResponse.json({ 
          error: "Token PENDING - verify in Webull App",
          tokenStatus: "PENDING"
        }, { status: 202 })
      }
      return NextResponse.json({ error: "No Webull accounts found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      data: summary,
      tokenStatus: tokenStatus?.status 
    })
  } catch (err: any) {
    console.error("[Webull Account]", err)
    
    // Check if error is due to pending token
    const tokenStatus = getTokenStatus()
    if (tokenStatus?.status === "PENDING") {
      return NextResponse.json({ 
        error: "Token PENDING - verify in Webull App",
        tokenStatus: "PENDING"
      }, { status: 202 })
    }
    
    return NextResponse.json({ error: err.message || "Failed to fetch account" }, { status: 500 })
  }
}
