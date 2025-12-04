/**
 * API Key validation middleware
 * Validates API keys, checks scopes, rate limits, and logs usage
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/drizzle"
import { apiKeys, apiKeyUsages } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { hashApiKeySync, isValidApiKeyFormat, hasRequiredScopes } from "@/lib/api-keys/utils"
import { checkRateLimit } from "@/lib/api-keys/rate-limit"

export interface ApiKeyContext {
  apiKey: {
    id: string
    userId: string
    name: string
    scopes: string[]
  }
  authorizedUser: {
    id: string
    email: string
    role: string
  }
}

/**
 * Validate API key from request
 * Returns the API key context or an error response
 */
export async function validateApiKey(
  request: NextRequest,
  requiredScopes: string[] = []
): Promise<{ success: true; context: ApiKeyContext } | { success: false; response: NextResponse }> {
  // Extract API key from header
  const apiKeyHeader = request.headers.get("x-api-key")

  if (!apiKeyHeader) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing API key", message: "Please provide an API key in the x-api-key header" },
        { status: 401 }
      ),
    }
  }

  // Validate format
  if (!isValidApiKeyFormat(apiKeyHeader)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid API key format", message: "API key must start with 'gispal_' and be 36-60 characters" },
        { status: 401 }
      ),
    }
  }

  // Hash the provided key
  const keyHash = hashApiKeySync(apiKeyHeader)

  // Find the API key in database
  const apiKey = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.deletedAt)))
    .limit(1)
    .then((rows) => rows[0])

  if (!apiKey) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid API key", message: "The provided API key is not valid" },
        { status: 401 }
      ),
    }
  }

  // Check if key is revoked
  if (apiKey.revokedAt) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "API key revoked", message: "This API key has been revoked" },
        { status: 403 }
      ),
    }
  }

  // Check if key is expired
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "API key expired", message: "This API key has expired" },
        { status: 403 }
      ),
    }
  }

  // Check scopes
  const keyScopes = (apiKey.scopes as string[]) || []
  if (requiredScopes.length > 0 && !hasRequiredScopes(keyScopes, requiredScopes)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Insufficient permissions",
          message: `This API key does not have the required scopes: ${requiredScopes.join(", ")}`,
          required: requiredScopes,
          granted: keyScopes,
        },
        { status: 403 }
      ),
    }
  }

  // Check rate limits
  const rateLimitResult = await checkRateLimit(
    apiKey.id,
    apiKey.rateLimitPerMinute,
    apiKey.rateLimitPerDay
  )

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You have exceeded your rate limit. Please try again later.",
          resetAt: rateLimitResult.resetAt?.toISOString(),
          remainingPerMinute: rateLimitResult.remainingPerMinute,
          remainingPerDay: rateLimitResult.remainingPerDay,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit-PerMinute": apiKey.rateLimitPerMinute.toString(),
            "X-RateLimit-Limit-PerDay": apiKey.rateLimitPerDay.toString(),
            "X-RateLimit-Remaining-PerMinute": rateLimitResult.remainingPerMinute.toString(),
            "X-RateLimit-Remaining-PerDay": rateLimitResult.remainingPerDay.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt?.toISOString() || "",
          },
        }
      ),
    }
  }

  // Get user information
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, apiKey.userId),
  })

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "User not found", message: "The user associated with this API key was not found" },
        { status: 500 }
      ),
    }
  }

  // Log usage (async, don't wait for it)
  const startTime = Date.now()
  const route = request.nextUrl.pathname
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  // Log usage asynchronously
  db.insert(apiKeyUsages)
    .values({
      apiKeyId: apiKey.id,
      route,
      ipAddress,
      userAgent,
      success: true,
      latencyMs: 0, // Will be updated if we track latency
    })
    .catch((error) => {
      console.error("[API-KEY] Failed to log usage:", error)
    })

  // Update last used timestamp
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .catch((error) => {
      console.error("[API-KEY] Failed to update lastUsedAt:", error)
    })

  return {
    success: true,
    context: {
      apiKey: {
        id: apiKey.id,
        userId: apiKey.userId,
        name: apiKey.name,
        scopes: keyScopes,
      },
      authorizedUser: {
        id: user.id,
        email: user.email,
        role: user.role || "user",
      },
    },
  }
}

