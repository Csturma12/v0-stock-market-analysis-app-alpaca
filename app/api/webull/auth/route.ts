import { NextResponse } from "next/server"
import { getAuthorizationUrl } from "@/lib/webull"

export const dynamic = "force-dynamic"

/**
 * GET /api/webull/auth
 * Returns the Webull OAuth authorization URL
 * Frontend should redirect user to this URL
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get("origin") ?? new URL(req.url).origin
  const redirectUri = `${origin}/api/webull/auth/callback`
  
  const state = crypto.randomUUID() // In production, store this to verify callback
  const authUrl = getAuthorizationUrl(redirectUri, state)
  
  return NextResponse.json({ authUrl, state })
}
