import { NextResponse } from "next/server"
import { exchangeCodeForToken } from "@/lib/webull"

export const dynamic = "force-dynamic"

/**
 * GET /api/webull/auth/callback
 * Handles the OAuth callback from Webull
 * Exchanges the authorization code for access token
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  
  if (error) {
    // User denied access or error occurred
    return NextResponse.redirect(`${origin}/trading?webull_error=${error}`)
  }
  
  if (!code) {
    return NextResponse.redirect(`${origin}/trading?webull_error=no_code`)
  }
  
  const redirectUri = `${origin}/api/webull/auth/callback`
  const tokens = await exchangeCodeForToken(code, redirectUri)
  
  if (!tokens) {
    return NextResponse.redirect(`${origin}/trading?webull_error=token_exchange_failed`)
  }
  
  // In production, save tokens to database for the user
  // For now, we'll pass them as URL params (NOT secure for production!)
  // TODO: Implement proper token storage in Supabase
  
  // Redirect back to trading page with success
  return NextResponse.redirect(`${origin}/trading?webull_connected=true`)
}
