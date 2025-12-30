/**
 * Admin API Routes for individual API key operations
 * GET: Get API key details
 * PATCH: Update API key (force)
 * DELETE: Force revoke API key
 */

import { NextRequest, NextResponse } from "next/server"
import { adminOnly } from "@/lib/api/middleware/adminGuard"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { ALL_SCOPES } from "@/lib/api-keys/utils"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateApiKeySchema = z.object({
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
  rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
  scopes: z.array(z.string()).optional(),
})

/**
 * GET /api/admin/api-keys/[id]
 * Get API key details (admin only)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCheck = await adminOnly(request)
    if (!adminCheck.success) {
      return adminCheck.response
    }

    const apiKeyId = params.id

    const apiKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, apiKeyId),
      with: {
        user: true,
        usages: {
          limit: 100,
          orderBy: (usages, { desc }) => [desc(usages.timestamp)],
        },
      },
    })

    if (!apiKey) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      scopes: apiKey.scopes as string[],
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      revokedAt: apiKey.revokedAt,
      deletedAt: apiKey.deletedAt,
      usageCount: apiKey.usageCount || 0,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      rateLimitPerDay: apiKey.rateLimitPerDay,
      userId: apiKey.userId,
      user: apiKey.user
        ? {
            id: apiKey.user.id,
            email: apiKey.user.email,
            name: apiKey.user.name,
          }
        : null,
      status: apiKey.revokedAt
        ? "revoked"
        : apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()
          ? "expired"
          : "active",
    })
  } catch (error: any) {
    console.error("[ADMIN-API-KEYS] Error getting key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/api-keys/[id]
 * Update API key (admin force update)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCheck = await adminOnly(request)
    if (!adminCheck.success) {
      return adminCheck.response
    }

    const apiKeyId = params.id
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

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validated.rateLimitPerMinute !== undefined) updateData.rateLimitPerMinute = validated.rateLimitPerMinute
    if (validated.rateLimitPerDay !== undefined) updateData.rateLimitPerDay = validated.rateLimitPerDay
    if (validated.scopes !== undefined) updateData.scopes = validated.scopes

    const updated = await db
      .update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, apiKeyId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const apiKey = updated[0]

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      scopes: apiKey.scopes as string[],
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      rateLimitPerDay: apiKey.rateLimitPerDay,
      updatedAt: apiKey.updatedAt,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[ADMIN-API-KEYS] Error updating key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Force revoke API key (admin only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCheck = await adminOnly(request)
    if (!adminCheck.success) {
      return adminCheck.response
    }

    const apiKeyId = params.id

    const updated = await db
      .update(apiKeys)
      .set({
        revokedAt: new Date(),
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "API key force revoked successfully" })
  } catch (error: any) {
    console.error("[ADMIN-API-KEYS] Error revoking key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

