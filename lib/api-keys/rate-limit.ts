/**
 * Rate limiting utilities for API keys
 */

import { db } from "@/lib/db/drizzle"
import { apiKeyUsages } from "@/lib/db/schema"
import { eq, and, gte, lte, count, sql, isNull } from "drizzle-orm"

export interface RateLimitResult {
  allowed: boolean
  remainingPerMinute: number
  remainingPerDay: number
  resetAt?: Date
}

/**
 * Check rate limits for an API key
 * Returns whether the request is allowed and remaining quotas
 */
export async function checkRateLimit(
  apiKeyId: string,
  rateLimitPerMinute: number,
  rateLimitPerDay: number
): Promise<RateLimitResult> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Count requests in the last minute
  const minuteCount = await db
    .select({ count: count() })
    .from(apiKeyUsages)
    .where(
      and(
        eq(apiKeyUsages.apiKeyId, apiKeyId),
        gte(apiKeyUsages.timestamp, oneMinuteAgo),
        isNull(apiKeyUsages.deletedAt)
      )
    )
    .then((rows) => rows[0]?.count || 0)

  // Count requests in the last day
  const dayCount = await db
    .select({ count: count() })
    .from(apiKeyUsages)
    .where(
      and(
        eq(apiKeyUsages.apiKeyId, apiKeyId),
        gte(apiKeyUsages.timestamp, oneDayAgo),
        isNull(apiKeyUsages.deletedAt)
      )
    )
    .then((rows) => rows[0]?.count || 0)

  const remainingPerMinute = Math.max(0, rateLimitPerMinute - minuteCount)
  const remainingPerDay = Math.max(0, rateLimitPerDay - dayCount)

  const allowed = minuteCount < rateLimitPerMinute && dayCount < rateLimitPerDay

  // Calculate reset time (next minute boundary)
  const resetAt = new Date(now)
  resetAt.setSeconds(0)
  resetAt.setMilliseconds(0)
  resetAt.setMinutes(resetAt.getMinutes() + 1)

  return {
    allowed,
    remainingPerMinute,
    remainingPerDay,
    resetAt,
  }
}

