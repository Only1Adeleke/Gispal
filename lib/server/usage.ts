/**
 * Server-side usage analytics data fetching with caching
 * Used by Server Components for optimal performance
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { apiKeyUsages } from "@/lib/db/schema"
import { eq, and, gte, sql, isNull, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { canAccessApiKey } from "@/lib/api-keys/permissions"

export interface ServerUsageStats {
  range?: string
  today: number
  thisMonth: number
  total: number
  success: number
  errors: number
  avgLatency?: number
  callsPerHour?: Array<{ hour: number; count: number }>
  topRoutes: Array<{ route: string; count: number }>
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
 * Fetch API key usage statistics with caching
 */
export async function getApiKeyUsage(
  apiKeyId: string,
  range: "today" | "7d" | "30d" = "today"
): Promise<ServerUsageStats> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      today: 0,
      thisMonth: 0,
      total: 0,
      success: 0,
      errors: 0,
      topRoutes: [],
    }
  }

  // Check access
  const hasAccess = await canAccessApiKey(session.user.id, apiKeyId)
  if (!hasAccess) {
    return {
      today: 0,
      thisMonth: 0,
      total: 0,
      success: 0,
      errors: 0,
      topRoutes: [],
    }
  }

  const getCachedUsage = unstable_cache(
    async () => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      let rangeStart: Date
      if (range === "today") {
        rangeStart = todayStart
      } else if (range === "7d") {
        rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // Determine if using SQLite or Postgres
      const isPostgres = process.env.DATABASE_URL?.startsWith("postgres")

      // Get all usage stats in parallel
      const [todayCount, monthCount, totalCount, successCount, errorCount, avgLatency, hourlyData, topRoutes] = await Promise.all([
        // Today's count
        db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              gte(apiKeyUsages.timestamp, todayStart)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // This month's count
        db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              gte(apiKeyUsages.timestamp, monthStart)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // Total count
        db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // Success count
        db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              eq(apiKeyUsages.success, 1)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // Error count
        db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              eq(apiKeyUsages.success, 0)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // Average latency
        db
          .select({ avg: sql<number>`avg(${apiKeyUsages.latencyMs})` })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              gte(apiKeyUsages.timestamp, rangeStart)
            )
          )
          .then((rows) => Number(rows[0]?.avg || 0)),

        // Hourly data (for charts)
        db
          .select({
            hour: isPostgres
              ? sql<number>`EXTRACT(HOUR FROM ${apiKeyUsages.timestamp})`
              : sql<number>`CAST(strftime('%H', datetime(${apiKeyUsages.timestamp}, 'unixepoch')) AS INTEGER)`,
            count: sql<number>`count(*)`,
          })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              gte(apiKeyUsages.timestamp, rangeStart)
            )
          )
          .groupBy(
            isPostgres
              ? sql`EXTRACT(HOUR FROM ${apiKeyUsages.timestamp})`
              : sql`strftime('%H', datetime(${apiKeyUsages.timestamp}, 'unixepoch'))`
          )
          .orderBy(desc(sql`count(*)`))
          .limit(24)
          .then((rows) =>
            rows.map((r) => ({
              hour: Number(r.hour),
              count: Number(r.count),
            }))
          ),

        // Top routes
        db
          .select({
            route: apiKeyUsages.route,
            count: sql<number>`count(*)`,
          })
          .from(apiKeyUsages)
          .where(
            and(
              eq(apiKeyUsages.apiKeyId, apiKeyId),
              isNull(apiKeyUsages.deletedAt),
              gte(apiKeyUsages.timestamp, rangeStart)
            )
          )
          .groupBy(apiKeyUsages.route)
          .orderBy(desc(sql`count(*)`))
          .limit(10)
          .then((rows) =>
            rows.map((r) => ({
              route: r.route,
              count: Number(r.count),
            }))
          ),
      ])

      return {
        range,
        today: todayCount,
        thisMonth: monthCount,
        total: totalCount,
        success: successCount,
        errors: errorCount,
        avgLatency: avgLatency > 0 ? Math.round(avgLatency) : undefined,
        callsPerHour: hourlyData,
        topRoutes,
      }
    },
    [`api-key-usage-${apiKeyId}-${range}`],
    {
      revalidate: 60, // 1 minute
      tags: [`api-key-usage-${apiKeyId}`],
    }
  )

  return getCachedUsage()
}

