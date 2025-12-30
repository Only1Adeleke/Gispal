/**
 * Server-side dashboard data fetching with caching
 * Used by Server Components for optimal performance
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { apiKeys, apiKeyUsages } from "@/lib/db/schema"
import { eq, and, isNull, gte, desc, sql, or } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Get current user session (server-side)
 */
async function getServerSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  return session
}

export interface DashboardMetrics {
  activeApiKeys: number
  totalApiKeys: number
  totalUsage: number
  downloads: number
  currentPlan: string
  planUsage: {
    used: number
    limit: number
    percentage: number
  }
}

export interface UsageData {
  "7d": Array<{ date: string; value: number }>
  "30d": Array<{ date: string; value: number }>
  "90d": Array<{ date: string; value: number }>
}

export interface ActivityItem {
  id: string
  type: "api_call" | "key_created" | "key_rotated" | "key_revoked"
  description: string
  timestamp: Date | string
  status?: "success" | "error"
}

/**
 * Fetch dashboard metrics with caching
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      activeApiKeys: 0,
      totalApiKeys: 0,
      totalUsage: 0,
      downloads: 0,
      currentPlan: "Free",
      planUsage: {
        used: 0,
        limit: 1000,
        percentage: 0,
      },
    }
  }

  const userId = session.user.id

  const getCachedMetrics = unstable_cache(
    async () => {
      const keys = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      const activeKeys = keys.filter((k) => !k.revokedAt && (!k.expiresAt || new Date(k.expiresAt) > new Date()))
      const totalUsage = keys.reduce((sum, k) => sum + (k.usageCount || 0), 0)

      // Get usage from api_key_usages table
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let todayUsage = 0
      if (keys.length > 0) {
        const keyIds = keys.map((k) => k.id)
        // Build OR conditions for SQLite
        const keyConditions = keyIds.length > 0
          ? or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!
          : undefined
        
        if (keyConditions) {
          todayUsage = await db
            .select({ count: sql<number>`count(*)` })
            .from(apiKeyUsages)
            .where(
              and(
                keyConditions,
                sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(today.getTime()))}`,
                isNull(apiKeyUsages.deletedAt)
              )
            )
            .then((rows) => Number(rows[0]?.count || 0))
        }
      }

      return {
        activeApiKeys: activeKeys.length,
        totalApiKeys: keys.length,
        totalUsage,
        downloads: 0, // TODO: Add downloads tracking
        currentPlan: "Free", // TODO: Get from subscription
        planUsage: {
          used: todayUsage,
          limit: 1000,
          percentage: Math.min((todayUsage / 1000) * 100, 100),
        },
      }
    },
    [`dashboard-metrics-${userId}`],
    {
      revalidate: 30, // 30 seconds
      tags: [`dashboard-metrics-${userId}`],
    }
  )

  return getCachedMetrics()
}

/**
 * Fetch usage chart data with caching
 */
export async function getUsageChartData(): Promise<UsageData> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      "7d": [],
      "30d": [],
      "90d": [],
    }
  }

  const userId = session.user.id

  const getCachedUsage = unstable_cache(
    async () => {
      const keys = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      if (keys.length === 0) {
        return {
          "7d": [],
          "30d": [],
          "90d": [],
        }
      }

      const keyIds = keys.map((k) => k.id)
      const now = new Date()

      // Generate date ranges
      const ranges = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
      }

      const result: UsageData = {
        "7d": [],
        "30d": [],
        "90d": [],
      }

      for (const [range, days] of Object.entries(ranges)) {
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - days)
        
        // Generate dates for the range
        const dates: string[] = []
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate)
          date.setDate(date.getDate() + i)
          dates.push(date.toISOString().split("T")[0])
        }

        // Get usage for each day
        const usageData = await Promise.all(
          dates.map(async (date) => {
            const dayStart = new Date(date)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)

            if (keyIds.length === 0) {
              return {
                date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                value: 0,
              }
            }
            
            const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!
            
            const count = await db
              .select({ count: sql<number>`count(*)` })
              .from(apiKeyUsages)
              .where(
                and(
                  keyConditions,
                  sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(dayStart.getTime()))}`,
                  sql`${apiKeyUsages.timestamp} <= ${sql.raw(String(dayEnd.getTime()))}`,
                  isNull(apiKeyUsages.deletedAt)
                )
              )
              .then((rows) => Number(rows[0]?.count || 0))

            return {
              date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              value: count,
            }
          })
        )

        result[range as keyof UsageData] = usageData
      }

      return result
    },
    [`usage-chart-${userId}`],
    {
      revalidate: 60, // 1 minute
      tags: [`usage-chart-${userId}`],
    }
  )

  return getCachedUsage()
}

/**
 * Fetch recent activity with caching
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return []
  }

  const userId = session.user.id

  const getCachedActivity = unstable_cache(
    async () => {
      // Get recent API key changes
      const recentKeys = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))
        .orderBy(desc(apiKeys.createdAt))
        .limit(5)

      const activities: ActivityItem[] = recentKeys.map((key) => ({
        id: key.id,
        type: "key_created" as const,
        description: `API key "${key.name}" created`,
        timestamp: key.createdAt,
        status: "success" as const,
      }))

      // Get recent API calls
      let usageActivities: ActivityItem[] = []
      if (recentKeys.length > 0) {
        const keyIds = recentKeys.map((k) => k.id)
        if (keyIds.length === 0) {
          return activities.slice(0, limit)
        }
        
        const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!
        
        const recentUsage = await db
          .select({
            id: apiKeyUsages.id,
            route: apiKeyUsages.route,
            success: apiKeyUsages.success,
            timestamp: apiKeyUsages.timestamp,
          })
          .from(apiKeyUsages)
          .where(
            and(
              keyConditions,
              isNull(apiKeyUsages.deletedAt)
            )
          )
          .orderBy(desc(apiKeyUsages.timestamp))
          .limit(limit - activities.length)

        usageActivities = recentUsage.map((usage) => ({
          id: usage.id,
          type: "api_call" as const,
          description: `API call to ${usage.route}`,
          timestamp: usage.timestamp,
          status: usage.success ? ("success" as const) : ("error" as const),
        }))
      }

      return [...activities, ...usageActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    },
    [`recent-activity-${userId}`],
    {
      revalidate: 30, // 30 seconds
      tags: [`recent-activity-${userId}`],
    }
  )

  return getCachedActivity()
}
