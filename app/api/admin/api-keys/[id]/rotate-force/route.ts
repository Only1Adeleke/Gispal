/**
 * POST /api/admin/api-keys/[id]/rotate-force
 * Force rotate an API key (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { adminOnly } from "@/lib/api/middleware/adminGuard"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { generateApiKey, hashApiKeySync } from "@/lib/api-keys/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/api-keys/[id]/rotate-force
 * Force rotate API key - creates a new key and revokes the old one (admin only)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCheck = await adminOnly(request)
    if (!adminCheck.success) {
      return adminCheck.response
    }

    const apiKeyId = params.id

    // Get the old key
    const oldKey = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1)
      .then((rows) => rows[0])

    if (!oldKey) {
      return NextResponse.json({ error: "Not found", message: "API key not found" }, { status: 404 })
    }

    // Generate new key with prefix
    const { key: rawKey, prefix } = generateApiKey()
    const keyHash = hashApiKeySync(rawKey)

    // Create new key with same settings
    const newKey = await db
      .insert(apiKeys)
      .values({
        userId: oldKey.userId,
        keyHash,
        prefix,
        name: `${oldKey.name} (rotated by admin)`,
        scopes: oldKey.scopes as string[],
        expiresAt: oldKey.expiresAt,
        rateLimitPerMinute: oldKey.rateLimitPerMinute,
        rateLimitPerDay: oldKey.rateLimitPerDay,
        usageCount: 0,
      })
      .returning()

    // Revoke old key
    await db
      .update(apiKeys)
      .set({
        revokedAt: new Date(),
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId))

    const createdKey = newKey[0]

    return NextResponse.json(
      {
        id: createdKey.id,
        key: rawKey, // Only returned once on rotation
        name: createdKey.name,
        prefix: createdKey.prefix,
        scopes: createdKey.scopes as string[],
        createdAt: createdKey.createdAt,
        expiresAt: createdKey.expiresAt,
        rateLimitPerMinute: createdKey.rateLimitPerMinute,
        rateLimitPerDay: createdKey.rateLimitPerDay,
        oldKeyId: apiKeyId,
        warning: "Save this key now. You will not be able to see it again. The old key has been revoked.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[ADMIN-API-KEYS] Error force rotating key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

