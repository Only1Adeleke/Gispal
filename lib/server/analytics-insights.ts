/**
 * Server-side insights generation for analytics
 * Analyzes usage patterns and generates actionable insights
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { apiKeys, apiKeyUsages } from "@/lib/db/schema"
import { eq, and, isNull, sql, or, desc, count } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getAnalyticsKPIs, getUsageByFeature, getUsageByKey, getPlanLimits } from "./analytics"

/**
 * Get current user session (server-side)
 */
async function getServerSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  return session
}

export type InsightType = "cost_driver" | "optimization" | "warning" | "positive"

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  impact: "Positive" | "Warning" | "Cost Driver" | "Optimization"
  cta?: {
    label: string
    href: string
  }
  icon: "TrendingUp" | "AlertTriangle" | "DollarSign" | "Zap" | "ArrowUp" | "ArrowDown" | "Clock"
}

/**
 * Generate insights from analytics data
 */
export async function generateInsights(range: "7d" | "30d" | "90d" = "30d"): Promise<Insight[]> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return []
  }

  const userId = session.user.id

  // Fetch all analytics data outside cache (they have their own caching)
  const [kpis, usageByFeature, usageByKey, planLimits] = await Promise.all([
    getAnalyticsKPIs(range),
    getUsageByFeature(range),
    getUsageByKey(range),
    getPlanLimits(),
  ])

  const getCachedInsights = unstable_cache(
    async (userId: string, kpis: any, usageByFeature: any, usageByKey: any, planLimits: any) => {
      const insights: Insight[] = []

      // Get detailed usage data for analysis
      const keys = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.deletedAt)))

      if (keys.length === 0) {
        return []
      }

      const keyIds = keys.map((k) => k.id)
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
      const now = new Date()
      const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)
      const previousEnd = currentStart

      const keyConditions = or(...keyIds.map((id) => eq(apiKeyUsages.apiKeyId, id)))!

      // Get current period stats
      // For SQLite compatibility, we'll get success/failed counts separately
      const currentTotal = await db
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

      const currentSuccess = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(currentStart.getTime()))}`,
            eq(apiKeyUsages.success, 1),
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.count || 0))

      const currentFailed = currentTotal - currentSuccess

      const currentAvgLatency = await db
        .select({ avg: sql<number>`avg(${apiKeyUsages.latencyMs})` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(currentStart.getTime()))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.avg || 0))

      const currentStats = {
        total: currentTotal,
        success: currentSuccess,
        failed: currentFailed,
        avgLatency: currentAvgLatency,
      }

      // Get previous period stats for comparison
      const previousTotal = await db
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

      const previousAvgLatency = await db
        .select({ avg: sql<number>`avg(${apiKeyUsages.latencyMs})` })
        .from(apiKeyUsages)
        .where(
          and(
            keyConditions,
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(previousStart.getTime()))}`,
            sql`${apiKeyUsages.timestamp} < ${sql.raw(String(previousEnd.getTime()))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .then((rows) => Number(rows[0]?.avg || 0))

      const previousStats = {
        total: previousTotal,
        avgLatency: previousAvgLatency,
      }

      // Use the stats directly (already numbers)
      const totalRequests = currentStats.total
      const successRequests = currentStats.success
      const failedRequests = currentStats.failed
      const avgLatency = currentStats.avgLatency
      const prevAvgLatency = previousStats.avgLatency

      // 1. Cost Driver Insights - Dominant feature/route
      if (usageByFeature.length > 0) {
        const topFeature = usageByFeature[0]
        if (topFeature.percentage >= 50 && totalRequests > 100) {
          const featureGrowth = kpis.apiRequests.trend
          insights.push({
            id: `cost-driver-${topFeature.feature}`,
            type: "cost_driver",
            title: "Primary Cost Driver Identified",
            description: `API usage from '${topFeature.feature}' accounts for ${topFeature.percentage}% of total requests${featureGrowth > 0 ? ` and increased ${featureGrowth}% this period` : ""}. This is your main consumption source.`,
            impact: "Cost Driver",
            icon: "DollarSign",
            cta: {
              label: "View Feature Details",
              href: `/dashboard/analytics?feature=${encodeURIComponent(topFeature.feature)}`,
            },
          })
        }
      }

      // 2. Optimization Opportunity - High failure rate
      if (totalRequests > 0) {
        const failureRate = (failedRequests / totalRequests) * 100
        if (failureRate >= 10) {
          insights.push({
            id: "optimization-failures",
            type: "optimization",
            title: "High Failure Rate Detected",
            description: `${failureRate.toFixed(1)}% of API requests are failing. Review error logs and consider implementing retry logic or updating API keys.`,
            impact: "Optimization",
            icon: "Zap",
            cta: {
              label: "Review API Keys",
              href: "/dashboard/api-keys",
            },
          })
        }
      }

      // 3. Optimization - Key rotation recommendation
      const oldKeys = keys.filter((k) => {
        const createdAt = new Date(k.createdAt)
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceCreation > 90 && !k.revokedAt
      })
      if (oldKeys.length > 0 && totalRequests > 0) {
        insights.push({
          id: "optimization-key-rotation",
          type: "optimization",
          title: "Key Rotation Recommended",
          description: `${oldKeys.length} API key${oldKeys.length > 1 ? "s have" : " has"} not been rotated in over 90 days. Regular rotation improves security and may reduce failed requests.`,
          impact: "Optimization",
          icon: "Clock",
          cta: {
            label: "Rotate Keys",
            href: "/dashboard/api-keys",
          },
        })
      }

      // 4. Warning - Approaching rate limit
      const dailyPercentage = (planLimits.usedToday / planLimits.rateLimitPerDay) * 100
      if (dailyPercentage >= 80 && dailyPercentage < 95) {
        const daysUntilLimit = Math.ceil((planLimits.rateLimitPerDay - planLimits.usedToday) / (planLimits.usedToday / (range === "7d" ? 7 : range === "30d" ? 30 : 90)))
        insights.push({
          id: "warning-rate-limit",
          type: "warning",
          title: "Approaching Daily Rate Limit",
          description: `At current usage, you will hit your daily API limit in approximately ${daysUntilLimit} day${daysUntilLimit !== 1 ? "s" : ""}. Consider upgrading your plan to avoid rate limiting.`,
          impact: "Warning",
          icon: "AlertTriangle",
          cta: {
            label: "Upgrade Plan",
            href: "/dashboard/billing",
          },
        })
      } else if (dailyPercentage >= 95) {
        insights.push({
          id: "warning-rate-limit-critical",
          type: "warning",
          title: "Rate Limit Imminent",
          description: `You've used ${dailyPercentage.toFixed(0)}% of your daily API limit. Requests may be throttled until tomorrow. Upgrade now to avoid service interruption.`,
          impact: "Warning",
          icon: "AlertTriangle",
          cta: {
            label: "Upgrade Immediately",
            href: "/dashboard/billing",
          },
        })
      }

      // 5. Positive Trend - Latency improvement
      if (avgLatency > 0 && prevAvgLatency > 0) {
        const latencyChange = ((prevAvgLatency - avgLatency) / prevAvgLatency) * 100
        if (latencyChange >= 15) {
          insights.push({
            id: "positive-latency",
            type: "positive",
            title: "Performance Improvement",
            description: `Average API response latency decreased ${latencyChange.toFixed(0)}% compared to the previous period. Your requests are processing faster.`,
            impact: "Positive",
            icon: "TrendingUp",
          })
        }
      }

      // 6. Positive Trend - Usage growth (if healthy)
      if (kpis.apiRequests.trend > 20 && kpis.apiRequests.trend < 200 && totalRequests > 100) {
        insights.push({
          id: "positive-growth",
          type: "positive",
          title: "Healthy Usage Growth",
          description: `API requests increased ${kpis.apiRequests.trend}% this period. Growth is within sustainable limits and indicates increased adoption.`,
          impact: "Positive",
          icon: "ArrowUp",
        })
      }

      // 7. Cost Driver - Single API key dominance
      if (usageByKey.length > 0) {
        const topKey = usageByKey[0]
        if (topKey.percentage >= 60 && totalRequests > 50) {
          insights.push({
            id: `cost-driver-key-${topKey.keyId}`,
            type: "cost_driver",
            title: "API Key Concentration",
            description: `The API key '${topKey.keyName}' accounts for ${topKey.percentage}% of all requests. Consider distributing load across multiple keys for better resilience.`,
            impact: "Cost Driver",
            icon: "DollarSign",
            cta: {
              label: "Manage Keys",
              href: "/dashboard/api-keys",
            },
          })
        }
      }

      // Sort insights by priority: warning > cost_driver > optimization > positive
      const priorityOrder: Record<InsightType, number> = {
        warning: 0,
        cost_driver: 1,
        optimization: 2,
        positive: 3,
      }

      return insights
        .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
        .slice(0, 6) // Max 6 insights
    },
    [`analytics-insights-${userId}-${range}`],
    {
      revalidate: 120, // 2 minutes
      tags: [`analytics-${userId}`],
    }
  )

  return getCachedInsights(userId, kpis, usageByFeature, usageByKey, planLimits)
}

