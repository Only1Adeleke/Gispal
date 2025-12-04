/**
 * API Routes for individual API key operations
 * GET: Get API key details
 * PATCH: Update API key
 * DELETE: Revoke/delete API key
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { canAccessApiKey } from "@/lib/api-keys/permissions"
import { ALL_SCOPES, type ApiScope } from "@/lib/api-keys/utils"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
  rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
})

/**
 * GET /api/keys/[id]
 * Get API key details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const apiKeyId = params.id

    // Check permissions
    if (!(await canAccessApiKey(userId, apiKeyId))) {
      return NextResponse.json({ error: "Forbidden", message: "You do not have access to this API key" }, { status: 403 })
    }

    // Get API key
    const apiKey = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1)
      .then((rows) => rows[0])

    if (!apiKey) {
      return NextResponse.json({ error: "Not found", message: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes as string[],
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      revokedAt: apiKey.revokedAt,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      rateLimitPerDay: apiKey.rateLimitPerDay,
      status: apiKey.revokedAt ? "revoked" : apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() ? "expired" : "active",
    })
  } catch (error: any) {
    console.error("[API-KEYS] Error getting key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/keys/[id]
 * Update API key
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const apiKeyId = params.id

    // Check permissions
    if (!(await canAccessApiKey(userId, apiKeyId))) {
      return NextResponse.json({ error: "Forbidden", message: "You do not have access to this API key" }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateApiKeySchema.parse(body)

    // Validate scopes if provided
    if (validated.scopes) {
      const invalidScopes = validated.scopes.filter((scope) => !(ALL_SCOPES as readonly string[]).includes(scope))
      if (invalidScopes.length > 0) {
        return NextResponse.json(
          { error: "Invalid scopes", message: `Invalid scopes: ${invalidScopes.join(", ")}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.scopes !== undefined) updateData.scopes = validated.scopes
    if (validated.expiresAt !== undefined) updateData.expiresAt = validated.expiresAt === null ? null : new Date(validated.expiresAt)
    if (validated.rateLimitPerMinute !== undefined) updateData.rateLimitPerMinute = validated.rateLimitPerMinute
    if (validated.rateLimitPerDay !== undefined) updateData.rateLimitPerDay = validated.rateLimitPerDay

    // Update API key
    const updated = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found", message: "API key not found" }, { status: 404 })
    }

    const apiKey = updated[0]

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes as string[],
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      revokedAt: apiKey.revokedAt,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      rateLimitPerDay: apiKey.rateLimitPerDay,
      status: apiKey.revokedAt ? "revoked" : apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() ? "expired" : "active",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[API-KEYS] Error updating key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/keys/[id]
 * Revoke (soft delete) API key
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const apiKeyId = params.id

    // Check permissions
    if (!(await canAccessApiKey(userId, apiKeyId))) {
      return NextResponse.json({ error: "Forbidden", message: "You do not have access to this API key" }, { status: 403 })
    }

    // Revoke the key (set revokedAt and deletedAt)
    const updated = await db
      .update(apiKeys)
      .set({
        revokedAt: new Date(),
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found", message: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "API key revoked successfully" })
  } catch (error: any) {
    console.error("[API-KEYS] Error revoking key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

