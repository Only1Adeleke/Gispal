/**
 * Server-side API key data fetching with caching
 * Used by Server Components for optimal performance
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { isAdmin } from "@/lib/api-keys/permissions"

export interface ServerApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  createdAt: Date | string
  updatedAt: Date | string
  lastUsedAt: Date | string | null
  expiresAt: Date | string | null
  revokedAt: Date | string | null
  usageCount: number
  rateLimitPerMinute: number
  rateLimitPerDay: number
  status: "active" | "revoked" | "expired"
  userId: string
}

/**
 * Get current user session (server-side)
 */
async function getServerSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  return session
}

/**
 * Fetch user's API keys with caching
 */
export async function getUserApiKeys(): Promise<ServerApiKey[]> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return []
  }

  const userId = session.user.id
  const userIsAdmin = await isAdmin(userId)

  // Use unstable_cache for 30 seconds
  const getCachedKeys = unstable_cache(
    async () => {
      const keys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          prefix: apiKeys.prefix,
          scopes: apiKeys.scopes,
          createdAt: apiKeys.createdAt,
          updatedAt: apiKeys.updatedAt,
          lastUsedAt: apiKeys.lastUsedAt,
          expiresAt: apiKeys.expiresAt,
          revokedAt: apiKeys.revokedAt,
          usageCount: apiKeys.usageCount,
          rateLimitPerMinute: apiKeys.rateLimitPerMinute,
          rateLimitPerDay: apiKeys.rateLimitPerDay,
          userId: apiKeys.userId,
        })
        .from(apiKeys)
        .where(
          userIsAdmin 
            ? isNull(apiKeys.deletedAt) 
            : and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt))
        )

      return keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes as string[],
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        revokedAt: key.revokedAt,
        usageCount: key.usageCount || 0,
        rateLimitPerMinute: key.rateLimitPerMinute,
        rateLimitPerDay: key.rateLimitPerDay,
        status: key.revokedAt 
          ? "revoked" 
          : key.expiresAt && new Date(key.expiresAt) < new Date() 
            ? "expired" 
            : "active",
        userId: key.userId,
      }))
    },
    [`api-keys-${userId}-${userIsAdmin}`],
    {
      revalidate: 30, // 30 seconds
      tags: [`api-keys-${userId}`],
    }
  )

  return getCachedKeys()
}

