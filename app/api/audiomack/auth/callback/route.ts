import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAccessToken, storeToken } from "@/lib/audiomack/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * OAuth Step 3: Handle callback from Audiomack
 * GET /api/audiomack/auth/callback?oauth_token=...&oauth_verifier=...
 */
export async function GET(request: NextRequest) {
  console.log("[AUDIOMACK-OAUTH-CALLBACK] ========== START ==========")
  console.log("[AUDIOMACK-OAUTH-CALLBACK] Request URL:", request.url)
  console.log("[AUDIOMACK-OAUTH-CALLBACK] Request method: GET")
  
  try {
    // Check authentication
    console.log("[AUDIOMACK-OAUTH-CALLBACK] Checking authentication...")
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session || !session.user) {
      console.error("[AUDIOMACK-OAUTH-CALLBACK] Unauthorized - no session")
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url))
    }
    
    console.log("[AUDIOMACK-OAUTH-CALLBACK] User authenticated:", session.user.id)

    const searchParams = request.nextUrl.searchParams
    const oauthToken = searchParams.get("oauth_token")
    const oauthVerifier = searchParams.get("oauth_verifier")
    const oauthTokenSecret = searchParams.get("oauth_token_secret") // Should come from session

    console.log("[AUDIOMACK-OAUTH-CALLBACK] Query params:")
    console.log("[AUDIOMACK-OAUTH-CALLBACK]   oauth_token:", oauthToken ? oauthToken.substring(0, 10) + "..." : "MISSING")
    console.log("[AUDIOMACK-OAUTH-CALLBACK]   oauth_verifier:", oauthVerifier ? oauthVerifier.substring(0, 10) + "..." : "MISSING")
    console.log("[AUDIOMACK-OAUTH-CALLBACK]   oauth_token_secret:", oauthTokenSecret ? oauthTokenSecret.substring(0, 10) + "..." : "MISSING")

    if (!oauthToken || !oauthVerifier) {
      console.error("[AUDIOMACK-OAUTH-CALLBACK] Missing required parameters")
      return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", request.url))
    }

    // TODO: In production, retrieve oauthTokenSecret from secure session storage
    // For now, we'll need to pass it from the client or store it temporarily
    // This is a limitation - in a real app, you'd store it in a session/redis
    
    // For now, we'll require the client to send it in the request
    // In production, use proper session management
    if (!oauthTokenSecret) {
      console.error("[AUDIOMACK-OAUTH-CALLBACK] Missing oauth_token_secret")
      return NextResponse.json(
        { error: "oauth_token_secret required. Please initiate OAuth from /api/audiomack/auth/redirect" },
        { status: 400 }
      )
    }

    console.log("[AUDIOMACK-OAUTH-CALLBACK] Step 3: Exchanging request token for access token...")
    // Exchange request token for access token
    const { accessToken, accessTokenSecret, expiresAt } = await getAccessToken(
      oauthToken,
      oauthTokenSecret,
      oauthVerifier
    )

    console.log("[AUDIOMACK-OAUTH-CALLBACK] Step 3 complete, storing access token...")
    console.log("[AUDIOMACK-OAUTH-CALLBACK] Access token present:", !!accessToken)
    console.log("[AUDIOMACK-OAUTH-CALLBACK] Access token secret present:", !!accessTokenSecret)
    console.log("[AUDIOMACK-OAUTH-CALLBACK] Expires at:", expiresAt ? new Date(expiresAt * 1000).toISOString() : "none")

    // Store access token for user
    await storeToken(session.user.id, accessToken, accessTokenSecret, expiresAt)

    console.log("[AUDIOMACK-OAUTH-CALLBACK] Access token stored for user:", session.user.id)
    console.log("[AUDIOMACK-OAUTH-CALLBACK] ========== SUCCESS ==========")

    // Redirect to dashboard with success
    return NextResponse.redirect(new URL("/dashboard?audiomack_connected=true", request.url))
  } catch (error: any) {
    console.error("[AUDIOMACK-OAUTH-CALLBACK] ========== ERROR ==========")
    console.error("[AUDIOMACK-OAUTH-CALLBACK] Error message:", error.message)
    console.error("[AUDIOMACK-OAUTH-CALLBACK] Error stack:", error.stack)
    return NextResponse.redirect(new URL(`/dashboard?error=oauth_error&message=${encodeURIComponent(error.message)}`, request.url))
  }
}

/**
 * POST handler for callback (alternative flow where client sends oauth_token_secret)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { oauthToken, oauthTokenSecret, oauthVerifier } = body

    if (!oauthToken || !oauthTokenSecret || !oauthVerifier) {
      return NextResponse.json(
        { error: "oauth_token, oauth_token_secret, and oauth_verifier are required" },
        { status: 400 }
      )
    }

    console.log("[AUDIOMACK-OAUTH] Step 3: Exchanging request token for access token (POST)")

    const { accessToken, accessTokenSecret, expiresAt } = await getAccessToken(
      oauthToken,
      oauthTokenSecret,
      oauthVerifier
    )

    await storeToken(session.user.id, accessToken, accessTokenSecret, expiresAt)

    return NextResponse.json({
      success: true,
      message: "Audiomack OAuth connected successfully",
    })
  } catch (error: any) {
    console.error("[AUDIOMACK-OAUTH] Error in callback (POST):", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete OAuth flow" },
      { status: 500 }
    )
  }
}

