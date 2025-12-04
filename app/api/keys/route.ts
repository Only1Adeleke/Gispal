/**
 * API Routes for API Key management
 * GET: List user's API keys
 * POST: Create a new API key
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { generateApiKey, hashApiKeySync, ALL_SCOPES } from "@/lib/api-keys/utils"
import { canAccessApiKey, isAdmin } from "@/lib/api-keys/permissions"
import { apiKeyInsertSchema } from "@/lib/db/zod-schemas"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional(),
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional().default(60),
  rateLimitPerDay: z.number().int().min(1).max(1000000).optional().default(5000),
})

/**
 * GET /api/keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userIsAdmin = await isAdmin(userId)

    // Get all keys for user, or all keys if admin
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        rateLimitPerMinute: apiKeys.rateLimitPerMinute,
        rateLimitPerDay: apiKeys.rateLimitPerDay,
        userId: apiKeys.userId,
      })
      .from(apiKeys)
      .where(userIsAdmin ? isNull(apiKeys.deletedAt) : and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

    // Format response (never expose keyHash)
    const formattedKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      scopes: key.scopes as string[],
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      rateLimitPerMinute: key.rateLimitPerMinute,
      rateLimitPerDay: key.rateLimitPerDay,
      status: key.revokedAt ? "revoked" : key.expiresAt && new Date(key.expiresAt) < new Date() ? "expired" : "active",
      userId: key.userId,
    }))

    return NextResponse.json({ keys: formattedKeys })
  } catch (error: any) {
    console.error("[API-KEYS] Error listing keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate request body
    const validated = createApiKeySchema.parse(body)

    // Generate new API key
    const rawKey = generateApiKey()
    const keyHash = hashApiKeySync(rawKey)

    // Validate scopes
    const scopes = validated.scopes || []
    const invalidScopes = scopes.filter((scope) => !(ALL_SCOPES as readonly string[]).includes(scope))
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: "Invalid scopes", message: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      )
    }

    // Create API key in database
    const newKey = await db
      .insert(apiKeys)
      .values({
        userId,
        keyHash,
        name: validated.name,
        scopes: scopes,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        rateLimitPerMinute: validated.rateLimitPerMinute,
        rateLimitPerDay: validated.rateLimitPerDay,
      })
      .returning()

    const createdKey = newKey[0]

    // Return the key (only time user sees the raw key)
    return NextResponse.json(
      {
        id: createdKey.id,
        key: rawKey, // Only returned once on creation
        name: createdKey.name,
        scopes: createdKey.scopes as string[],
        createdAt: createdKey.createdAt,
        expiresAt: createdKey.expiresAt,
        rateLimitPerMinute: createdKey.rateLimitPerMinute,
        rateLimitPerDay: createdKey.rateLimitPerDay,
        warning: "Save this key now. You will not be able to see it again.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[API-KEYS] Error creating key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

