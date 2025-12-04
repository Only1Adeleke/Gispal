/**
 * Row-level permissions for API keys
 */

import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"

/**
 * Check if a user can access an API key
 * Returns true if:
 * - userId matches apiKey.userId, OR
 * - user is an admin
 */
export async function canAccessApiKey(userId: string, apiKeyId: string): Promise<boolean> {
  // Get the API key
  const apiKey = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
    .limit(1)
    .then((rows) => rows[0])

  if (!apiKey) {
    return false
  }

  // Check if user owns the key
  if (apiKey.userId === userId) {
    return true
  }

  // Check if user is admin
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  })

  return user?.role === "admin"
}

/**
 * Check if a user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  })

  return user?.role === "admin"
}

