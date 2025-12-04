/**
 * POST /api/keys/[id]/rotate
 * Rotate an API key (create new, revoke old)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { canAccessApiKey } from "@/lib/api-keys/permissions"
import { generateApiKey, hashApiKeySync } from "@/lib/api-keys/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/keys/[id]/rotate
 * Rotate API key - creates a new key and revokes the old one
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Generate new key
    const rawKey = generateApiKey()
    const keyHash = hashApiKeySync(rawKey)

    // Create new key with same settings
    const newKey = await db
      .insert(apiKeys)
      .values({
        userId: oldKey.userId,
        keyHash,
        name: `${oldKey.name} (rotated)`,
        scopes: oldKey.scopes as string[],
        expiresAt: oldKey.expiresAt,
        rateLimitPerMinute: oldKey.rateLimitPerMinute,
        rateLimitPerDay: oldKey.rateLimitPerDay,
      })
      .returning()

    // Revoke old key (preserve revokedAt timestamp)
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
    console.error("[API-KEYS] Error rotating key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

