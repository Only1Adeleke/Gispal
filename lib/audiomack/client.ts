/**
 * Audiomack OAuth 1.0a Client
 * Handles OAuth flow and authenticated requests
 */

import OAuth from "oauth-1.0a"
import crypto from "node:crypto"
import { getAudiomackConfig, requireAudiomackConfig } from "./env"
import { db } from "@/lib/db"
import { encrypt, decrypt } from "./crypto"

const API_BASE = "https://api.audiomack.com/v1"
const OAUTH_BASE = "https://audiomack.com/oauth"

/**
 * Create OAuth instance
 */
function createOAuth() {
  try {
    const { consumerKey, consumerSecret } = requireAudiomackConfig()
    console.log("[AUDIOMACK-CLIENT] Creating OAuth instance with credentials")
    
    return new OAuth({
      consumer: {
        key: consumerKey,
        secret: consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(baseString, key) {
        return crypto.createHmac("sha1", key).update(baseString).digest("base64")
      },
    })
  } catch (error: any) {
    console.error("[AUDIOMACK-CLIENT] Failed to create OAuth instance:", error.message)
    throw error
  }
}

/**
 * Get stored access token for a user
 */
export async function getStoredToken(userId: string): Promise<{ accessToken: string; accessTokenSecret: string } | null> {
  console.log(`[AUDIOMACK-CLIENT] Getting stored token for user: ${userId}`)
  
  try {
    const token = await db.audiomackTokens.findByUserId(userId)
    
    if (!token) {
      console.log(`[AUDIOMACK-CLIENT] No token found for user ${userId}`)
      return null
    }
    
    // Check if token is expired
    if (token.expiresAt && token.expiresAt < Date.now() / 1000) {
      console.log(`[AUDIOMACK-CLIENT] Token expired for user ${userId}, expiresAt: ${token.expiresAt}, now: ${Date.now() / 1000}`)
      return null
    }
    
    // Decrypt tokens
    try {
      const decrypted = {
        accessToken: decrypt(token.accessToken),
        accessTokenSecret: decrypt(token.accessTokenSecret),
      }
      console.log(`[AUDIOMACK-CLIENT] Successfully retrieved and decrypted token for user ${userId}`)
      return decrypted
    } catch (error: any) {
      console.error(`[AUDIOMACK-CLIENT] Failed to decrypt token for user ${userId}:`, error.message)
      return null
    }
  } catch (error: any) {
    console.error(`[AUDIOMACK-CLIENT] Error retrieving token for user ${userId}:`, error.message)
    return null
  }
}

/**
 * Store access token for a user
 */
export async function storeToken(
  userId: string,
  accessToken: string,
  accessTokenSecret: string,
  expiresAt?: number
): Promise<void> {
  await db.audiomackTokens.upsert({
    userId,
    accessToken: encrypt(accessToken),
    accessTokenSecret: encrypt(accessTokenSecret),
    expiresAt,
  })
}

/**
 * Make authenticated OAuth request
 */
export async function makeAuthenticatedRequest(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  userId?: string,
  body?: any
): Promise<Response> {
  console.log(`[AUDIOMACK-CLIENT] Making authenticated ${method} request to: ${url}`)
  console.log(`[AUDIOMACK-CLIENT] UserId: ${userId || "none"}`)
  
  try {
    const oauth = createOAuth()
    const { consumerKey, consumerSecret } = requireAudiomackConfig()
    
    // Get stored token if userId provided
    let token = { key: "", secret: "" }
    if (userId) {
      const storedToken = await getStoredToken(userId)
      if (storedToken) {
        token = {
          key: storedToken.accessToken,
          secret: storedToken.accessTokenSecret,
        }
        console.log(`[AUDIOMACK-CLIENT] Using stored access token for user ${userId}`)
      } else {
        console.warn(`[AUDIOMACK-CLIENT] No stored token found for user ${userId}, using empty token`)
      }
    } else {
      console.log(`[AUDIOMACK-CLIENT] No userId provided, using empty token (consumer-only auth)`)
    }
    
    const requestData = {
      url,
      method,
    }
    
    console.log(`[AUDIOMACK-CLIENT] Signing request with OAuth`)
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
    console.log(`[AUDIOMACK-CLIENT] OAuth header generated: ${Object.keys(authHeader).join(", ")}`)
    
    const headers: HeadersInit = {
      ...authHeader,
      "Content-Type": "application/json",
      "User-Agent": "Gispal/1.0",
    }
    
    const options: RequestInit = {
      method,
      headers,
    }
    
    if (body && (method === "POST" || method === "PUT")) {
      if (typeof body === "string") {
        options.body = body
      } else {
        options.body = JSON.stringify(body)
      }
      console.log(`[AUDIOMACK-CLIENT] Request body: ${typeof body === "string" ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100)}`)
    }
    
    console.log(`[AUDIOMACK-CLIENT] Sending ${method} request to ${url}`)
    const response = await fetch(url, options)
    console.log(`[AUDIOMACK-CLIENT] Response status: ${response.status} ${response.statusText}`)
    
    return response
  } catch (error: any) {
    console.error(`[AUDIOMACK-CLIENT] Error making authenticated request:`, error.message)
    throw error
  }
}

/**
 * Make non-authenticated request (for public tracks)
 */
export async function makePublicRequest(url: string): Promise<Response> {
  console.log(`[AUDIOMACK-CLIENT] Making public request to: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Gispal/1.0",
      },
    })
    
    console.log(`[AUDIOMACK-CLIENT] Public request response: ${response.status} ${response.statusText}`)
    return response
  } catch (error: any) {
    console.error(`[AUDIOMACK-CLIENT] Error making public request:`, error.message)
    throw error
  }
}

/**
 * Get request token (Step 1 of OAuth flow)
 */
export async function getRequestToken(callbackUrl: string): Promise<{ oauthToken: string; oauthTokenSecret: string }> {
  console.log(`[AUDIOMACK-CLIENT] Getting request token`)
  console.log(`[AUDIOMACK-CLIENT] Callback URL: ${callbackUrl}`)
  
  try {
    const oauth = createOAuth()
    const { consumerKey, consumerSecret } = requireAudiomackConfig()
    console.log(`[AUDIOMACK-CLIENT] Consumer key: ${consumerKey ? consumerKey.substring(0, 10) + "..." : "MISSING"}`)
    
    const url = `${API_BASE}/request_token`
    console.log(`[AUDIOMACK-CLIENT] Request token URL: ${url}`)
    
    const requestData = {
      url,
      method: "POST" as const,
    }
    
    const token = { key: "", secret: "" }
    console.log(`[AUDIOMACK-CLIENT] Signing request token request with callback: ${callbackUrl}`)
    // Add oauth_callback to requestData for signing
    const requestDataWithCallback = {
      ...requestData,
      oauth_callback: callbackUrl,
    }
    const authHeader = oauth.toHeader(oauth.authorize(requestDataWithCallback, token))
    console.log(`[AUDIOMACK-CLIENT] OAuth header generated for request token`)
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `oauth_callback=${encodeURIComponent(callbackUrl)}`,
    })
    
    console.log(`[AUDIOMACK-CLIENT] Request token response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const text = await response.text()
      console.error(`[AUDIOMACK-CLIENT] Failed to get request token: ${response.status} ${text}`)
      throw new Error(`Failed to get request token: ${response.status} ${text}`)
    }
    
    const text = await response.text()
    console.log(`[AUDIOMACK-CLIENT] Request token response body: ${text.substring(0, 200)}`)
    const params = new URLSearchParams(text)
    
    const oauthToken = params.get("oauth_token") || ""
    const oauthTokenSecret = params.get("oauth_token_secret") || ""
    
    console.log(`[AUDIOMACK-CLIENT] Request token obtained: ${oauthToken ? oauthToken.substring(0, 10) + "..." : "MISSING"}`)
    
    return {
      oauthToken,
      oauthTokenSecret,
    }
  } catch (error: any) {
    console.error(`[AUDIOMACK-CLIENT] Error getting request token:`, error.message)
    throw error
  }
}

/**
 * Get authorization URL (Step 2 of OAuth flow)
 */
export function getAuthorizationUrl(oauthToken: string): string {
  return `${OAUTH_BASE}/authenticate?oauth_token=${encodeURIComponent(oauthToken)}`
}

/**
 * Exchange request token for access token (Step 3 of OAuth flow)
 */
export async function getAccessToken(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<{ accessToken: string; accessTokenSecret: string; expiresAt?: number }> {
  console.log(`[AUDIOMACK-CLIENT] Exchanging request token for access token`)
  console.log(`[AUDIOMACK-CLIENT] OAuth token: ${oauthToken ? oauthToken.substring(0, 10) + "..." : "MISSING"}`)
  console.log(`[AUDIOMACK-CLIENT] OAuth verifier: ${oauthVerifier ? oauthVerifier.substring(0, 10) + "..." : "MISSING"}`)
  
  try {
    const oauth = createOAuth()
    const url = `${API_BASE}/access_token`
    console.log(`[AUDIOMACK-CLIENT] Access token URL: ${url}`)
    
    const requestData = {
      url,
      method: "POST" as const,
    }
    
    const token = {
      key: oauthToken,
      secret: oauthTokenSecret,
    }
    
    console.log(`[AUDIOMACK-CLIENT] Signing access token request with verifier`)
    // Add oauth_verifier to requestData for signing
    const requestDataWithVerifier = {
      ...requestData,
      oauth_verifier: oauthVerifier,
    }
    const authHeader = oauth.toHeader(oauth.authorize(requestDataWithVerifier, token))
    console.log(`[AUDIOMACK-CLIENT] OAuth header generated for access token`)
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `oauth_verifier=${encodeURIComponent(oauthVerifier)}`,
    })
    
    console.log(`[AUDIOMACK-CLIENT] Access token response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const text = await response.text()
      console.error(`[AUDIOMACK-CLIENT] Failed to get access token: ${response.status} ${text}`)
      throw new Error(`Failed to get access token: ${response.status} ${text}`)
    }
    
    const text = await response.text()
    console.log(`[AUDIOMACK-CLIENT] Access token response body: ${text.substring(0, 200)}`)
    const params = new URLSearchParams(text)
    
    const accessToken = params.get("oauth_token") || ""
    const accessTokenSecret = params.get("oauth_token_secret") || ""
    
    console.log(`[AUDIOMACK-CLIENT] Access token obtained: ${accessToken ? accessToken.substring(0, 10) + "..." : "MISSING"}`)
    
    // Access tokens expire 1 year after creation
    // We don't get the exact expiry from the API, so we'll set it to 1 year from now
    const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    console.log(`[AUDIOMACK-CLIENT] Access token expires at: ${expiresAt} (${new Date(expiresAt * 1000).toISOString()})`)
    
    return {
      accessToken,
      accessTokenSecret,
      expiresAt,
    }
  } catch (error: any) {
    console.error(`[AUDIOMACK-CLIENT] Error getting access token:`, error.message)
    throw error
  }
}

