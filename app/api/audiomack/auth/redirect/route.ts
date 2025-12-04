import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestToken, getAuthorizationUrl } from "@/lib/audiomack/client"
import { getAudiomackConfig } from "@/lib/audiomack/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * OAuth Step 1: Redirect user to Audiomack authorization
 * GET /api/audiomack/auth/redirect
 */
export async function GET(request: NextRequest) {
  console.log("[AUDIOMACK-OAUTH-REDIRECT] ========== START ==========")
  console.log("[AUDIOMACK-OAUTH-REDIRECT] Request URL:", request.url)
  console.log("[AUDIOMACK-OAUTH-REDIRECT] Request method: GET")
  
  try {
    // Check authentication
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Checking authentication...")
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session || !session.user) {
      console.error("[AUDIOMACK-OAUTH-REDIRECT] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[AUDIOMACK-OAUTH-REDIRECT] User authenticated:", session.user.id)
    console.log("[AUDIOMACK-OAUTH-REDIRECT] User email:", session.user.email)

    console.log("[AUDIOMACK-OAUTH-REDIRECT] Getting Audiomack config...")
    const config = getAudiomackConfig()
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Consumer key present:", !!config.consumerKey)
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Consumer secret present:", !!config.consumerSecret)
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Redirect URI:", config.redirectUri)
    
    const callbackUrl = config.redirectUri || `${request.nextUrl.origin}/api/audiomack/auth/callback`
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Final callback URL:", callbackUrl)

    console.log("[AUDIOMACK-OAUTH-REDIRECT] Step 1: Getting request token...")
    // Get request token
    const { oauthToken, oauthTokenSecret } = await getRequestToken(callbackUrl)
    
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Request token obtained")
    console.log("[AUDIOMACK-OAUTH-REDIRECT] OAuth token present:", !!oauthToken)
    console.log("[AUDIOMACK-OAUTH-REDIRECT] OAuth token secret present:", !!oauthTokenSecret)

    // Store request token in session or return it to client
    // For now, we'll store it in a temporary way (in production, use proper session storage)
    const authUrl = getAuthorizationUrl(oauthToken)
    console.log("[AUDIOMACK-OAUTH-REDIRECT] Authorization URL:", authUrl)

    console.log("[AUDIOMACK-OAUTH-REDIRECT] Step 1 complete")
    console.log("[AUDIOMACK-OAUTH-REDIRECT] ========== SUCCESS ==========")

    // Return authorization URL to client
    return NextResponse.json({
      authorizationUrl: authUrl,
      oauthToken, // Client will need this for callback
      oauthTokenSecret, // Store this temporarily (in production, use secure session)
    })
  } catch (error: any) {
    console.error("[AUDIOMACK-OAUTH-REDIRECT] ========== ERROR ==========")
    console.error("[AUDIOMACK-OAUTH-REDIRECT] Error message:", error.message)
    console.error("[AUDIOMACK-OAUTH-REDIRECT] Error stack:", error.stack)
    return NextResponse.json(
      { error: error.message || "Failed to initiate OAuth flow" },
      { status: 500 }
    )
  }
}

