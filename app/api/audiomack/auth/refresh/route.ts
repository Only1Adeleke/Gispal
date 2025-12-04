import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStoredToken, storeToken, getAccessToken } from "@/lib/audiomack/client"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Refresh Audiomack access token
 * POST /api/audiomack/auth/refresh
 * 
 * Note: Audiomack access tokens expire after 1 year.
 * This endpoint checks if token is expired and triggers re-authorization if needed.
 */
export async function POST(request: NextRequest) {
  console.log("[AUDIOMACK-REFRESH] ========== START ==========")
  console.log("[AUDIOMACK-REFRESH] Request URL:", request.url)
  
  try {
    console.log("[AUDIOMACK-REFRESH] Checking authentication...")
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session || !session.user) {
      console.error("[AUDIOMACK-REFRESH] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[AUDIOMACK-REFRESH] User authenticated:", session.user.id)

    console.log("[AUDIOMACK-REFRESH] Looking up token in database...")
    const token = await db.audiomackTokens.findByUserId(session.user.id)

    if (!token) {
      console.log("[AUDIOMACK-REFRESH] No token found for user:", session.user.id)
      return NextResponse.json(
        { error: "No Audiomack token found. Please connect your Audiomack account first." },
        { status: 404 }
      )
    }

    console.log("[AUDIOMACK-REFRESH] Token found")
    console.log("[AUDIOMACK-REFRESH] Token expires at:", token.expiresAt ? new Date(token.expiresAt * 1000).toISOString() : "never")
    console.log("[AUDIOMACK-REFRESH] Current time:", new Date().toISOString())

    // Check if token is expired
    if (token.expiresAt && token.expiresAt < Date.now() / 1000) {
      console.log("[AUDIOMACK-REFRESH] Token expired")
      return NextResponse.json(
        {
          error: "Token expired",
          message: "Please re-authorize your Audiomack account",
          requiresReauth: true,
        },
        { status: 401 }
      )
    }

    console.log("[AUDIOMACK-REFRESH] Token is still valid")
    console.log("[AUDIOMACK-REFRESH] ========== SUCCESS ==========")

    // Token is still valid
    return NextResponse.json({
      success: true,
      message: "Token is still valid",
      expiresAt: token.expiresAt,
    })
  } catch (error: any) {
    console.error("[AUDIOMACK-REFRESH] ========== ERROR ==========")
    console.error("[AUDIOMACK-REFRESH] Error message:", error.message)
    console.error("[AUDIOMACK-REFRESH] Error stack:", error.stack)
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    )
  }
}

