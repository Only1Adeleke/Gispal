/**
 * Server-side analytics data fetching with caching
 * User-facing analytics only (no admin data)
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { apiKeys, apiKeyUsages } from "@/lib/db/schema"
import { eq, and, isNull, sql, or, desc, count } from "drizzle-orm"
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

export interface AnalyticsKPIs {
  apiRequests: {
    current: number
    previous: number
    trend: number
  }
  audioMinutes: {
    current: number
    previous: number
    trend: number
  }
  downloads: {
    current: number
    previous: number
    trend: number
  }
  storageUsed: {
    current: number // in MB
    limit: number | "unlimited"
    percentage: number
  }
}

export interface UsageByFeature {
  feature: string
  requests: number
  percentage: number
}

export interface UsageByKey {
  keyId: string
  keyName: string
  keyPrefix: string
  requests: number
  percentage: number
  status: "active" | "revoked" | "expired"
}

export interface PlanLimits {
  planName: string
  rateLimitPerMinute: number
  rateLimitPerDay: number
  usedToday: number
  usedThisMonth: number
  storageLimit: number | "unlimited"
  storageUsed: number
  approachingLimit: boolean
  limitWarnings: string[]
}

/**
 * Fetch analytics KPIs with caching
 */
export async function getAnalyticsKPIs(range: "7d" | "30d" | "90d" = "30d"): Promise<AnalyticsKPIs> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      apiRequests: { current: 0, previous: 0, trend: 0 },
      audioMinutes: { current: 0, previous: 0, trend: 0 },
      downloads: { current: 0, previous: 0, trend: 0 },
      storageUsed: { current: 0, limit: "unlimited", percentage: 0 },
    }
  }

  const userId = session.user.id
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90

  const getCachedKPIs = unstable_cache(
    async () => {
      const keys = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      if (keys.length === 0) {
        return {
          apiRequests: { current: 0, previous: 0, trend: 0 },
          audioMinutes: { current: 0, previous: 0, trend: 0 },
          downloads: { current: 0, previous: 0, trend: 0 },
          storageUsed: { current: 0, limit: "unlimited", percentage: 0 },
        }
      }

      const keyIds = keys.map((k) => k.id)
      const now = new Date()
      const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)
      const previousEnd = currentStart

      const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!

      // Current period API requests
      const currentRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(currentStart.getTime()))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.count || 0))

      // Previous period API requests
      const previousRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(previousStart.getTime()))}`,
            sql`${apiKeyUsages.timestamp} < ${sql.raw(String(previousEnd.getTime()))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.count || 0))

      const trend = previousRequests > 0
        ? Math.round(((currentRequests - previousRequests) / previousRequests) * 100)
        : currentRequests > 0 ? 100 : 0

      // TODO: Calculate audio minutes from actual audio processing jobs
      // For now, estimate based on API calls to audio endpoints
      const audioEndpoints = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(currentStart.getTime()))}`,
            sql`${apiKeyUsages.route} LIKE '%audio%' OR ${apiKeyUsages.route} LIKE '%mix%'`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.count || 0))

      const currentAudioMinutes = Math.round(audioEndpoints * 3) // Estimate 3 minutes per audio job
      const previousAudioMinutes = Math.round((previousRequests * 0.1) * 3) // Estimate
      const audioTrend = previousAudioMinutes > 0
        ? Math.round(((currentAudioMinutes - previousAudioMinutes) / previousAudioMinutes) * 100)
        : currentAudioMinutes > 0 ? 100 : 0

      return {
        apiRequests: {
          current: currentRequests,
          previous: previousRequests,
          trend,
        },
        audioMinutes: {
          current: currentAudioMinutes,
          previous: previousAudioMinutes,
          trend: audioTrend,
        },
        downloads: {
          current: 0, // TODO: Track downloads
          previous: 0,
          trend: 0,
        },
        storageUsed: {
          current: 0, // TODO: Calculate from storage
          limit: "unlimited",
          percentage: 0,
        },
      }
    },
    [`analytics-kpis-${userId}-${range}`],
    {
      revalidate: 60, // 1 minute
      tags: [`analytics-${userId}`],
    }
  )

  return getCachedKPIs()
}

/**
 * Fetch usage breakdown by feature/route
 */
export async function getUsageByFeature(range: "7d" | "30d" | "90d" = "30d"): Promise<UsageByFeature[]> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return []
  }

  const userId = session.user.id
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90

  const getCachedBreakdown = unstable_cache(
    async () => {
      const keys = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      if (keys.length === 0) {
        return []
      }

      const keyIds = keys.map((k) => k.id)
      const now = new Date()
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!

      // Get route statistics
      const routeStats = await db
        .select({
          route: apiKeyUsages.route,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(startDate.getTime()))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .groupBy(apiKeyUsages.route)
        .orderBy(desc(sql<number>`count(*)`))

      const total = routeStats.reduce((sum, r) => sum + (r.count || 0), 0)

      // Group routes into features
      const featureMap = new Map<string, number>()
      
      routeStats.forEach((stat) => {
        const route = stat.route || "unknown"
        let feature = "Other"
        
        if (route.includes("/audio") || route.includes("/mix")) {
          feature = "Audio Processing"
        } else if (route.includes("/download") || route.includes("/youtube")) {
          feature = "Downloads"
        } else if (route.includes("/api/keys")) {
          feature = "API Management"
        } else if (route.includes("/jingle")) {
          feature = "Jingles"
        } else if (route.includes("/cover")) {
          feature = "Cover Art"
        } else if (route.includes("/wp/")) {
          feature = "WordPress Integration"
        }

        featureMap.set(feature, (featureMap.get(feature) || 0) + (stat.count || 0))
      })

      const features: UsageByFeature[] = Array.from(featureMap.entries())
        .map(([feature, requests]) => ({
          feature,
          requests,
          percentage: total > 0 ? Math.round((requests / total) * 100) : 0,
        }))
        .sort((a, b) => b.requests - a.requests)

      return features
    },
    [`usage-by-feature-${userId}-${range}`],
    {
      revalidate: 60,
      tags: [`analytics-${userId}`],
    }
  )

  return getCachedBreakdown()
}

/**
 * Fetch usage breakdown by API key
 */
export async function getUsageByKey(range: "7d" | "30d" | "90d" = "30d"): Promise<UsageByKey[]> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return []
  }

  const userId = session.user.id
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90

  const getCachedBreakdown = unstable_cache(
    async () => {
      const keys = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      if (keys.length === 0) {
        return []
      }

      const now = new Date()
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      // Get usage per key
      const usageByKey = await Promise.all(
        keys.map(async (key) => {
          const usageCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(apiKeyUsages)
            .where(
              and(
                eq(apiKeyUsages.apiKeyId, key.id),
                sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(startDate.getTime()))}`,
                isNull(apiKeyUsages.deletedAt)
              )
            )
            .then((rows) => Number(rows[0]?.count || 0))

          return {
            keyId: key.id,
            keyName: key.name,
            keyPrefix: key.prefix || "gispal_",
            requests: usageCount,
            status: key.revokedAt
              ? ("revoked" as const)
              : key.expiresAt && new Date(key.expiresAt) < new Date()
                ? ("expired" as const)
                : ("active" as const),
          }
        })
      )

      const total = usageByKey.reduce((sum, k) => sum + k.requests, 0)

      return usageByKey
        .map((key) => ({
          ...key,
          percentage: total > 0 ? Math.round((key.requests / total) * 100) : 0,
        }))
        .sort((a, b) => b.requests - a.requests)
    },
    [`usage-by-key-${userId}-${range}`],
    {
      revalidate: 60,
      tags: [`analytics-${userId}`],
    }
  )

  return getCachedBreakdown()
}

/**
 * Fetch plan limits and usage
 */
export async function getPlanLimits(): Promise<PlanLimits> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      planName: "Free",
      rateLimitPerMinute: 60,
      rateLimitPerDay: 1000,
      usedToday: 0,
      usedThisMonth: 0,
      storageLimit: 100, // MB
      storageUsed: 0,
      approachingLimit: false,
      limitWarnings: [],
    }
  }

  const userId = session.user.id

  const getCachedLimits = unstable_cache(
    async () => {
      // Get user's subscription (simplified - you may need to join with subscriptions table)
      // For now, use default limits
      const planName = "Free" // TODO: Get from subscription
      const rateLimitPerMinute = 60
      const rateLimitPerDay = 1000

      // Get today's usage
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      const keys = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      let usedToday = 0
      let usedThisMonth = 0

      if (keys.length > 0) {
        const keyIds = keys.map((k) => k.id)
        const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!

        usedToday = await db
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

        usedThisMonth = await db
          .select({ count: sql<number>`count(*)` })
          .from(apiKeyUsages)
          .where(
            and(
              keyConditions,
              sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(monthStart.getTime()))}`,
              isNull(apiKeyUsages.deletedAt)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0))
      }

      const dailyPercentage = (usedToday / rateLimitPerDay) * 100
      const approachingLimit = dailyPercentage >= 80

      const limitWarnings: string[] = []
      if (approachingLimit) {
        limitWarnings.push(
          `You've used ${dailyPercentage.toFixed(0)}% of your daily limit. Consider upgrading to avoid rate limiting.`
        )
      }
      if (usedToday >= rateLimitPerDay * 0.9) {
        limitWarnings.push(
          "You're approaching your daily rate limit. Requests may be throttled until tomorrow."
        )
      }

      return {
        planName,
        rateLimitPerMinute,
        rateLimitPerDay,
        usedToday,
        usedThisMonth,
        storageLimit: "unlimited", // TODO: Get from subscription
        storageUsed: 0, // TODO: Calculate from storage
        approachingLimit,
        limitWarnings,
      }
    },
    [`plan-limits-${userId}`],
    {
      revalidate: 30,
      tags: [`analytics-${userId}`],
    }
  )

  return getCachedLimits()
}

