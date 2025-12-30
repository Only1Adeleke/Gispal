/**
 * GET /api/keys/[id]/usage
 * Get usage statistics for an API key
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { apiKeys, apiKeyUsages } from "@/lib/db/schema"
import { eq, and, isNull, gte, count, sql } from "drizzle-orm"
import { canAccessApiKey } from "@/lib/api-keys/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/keys/[id]/usage
 * Get usage statistics for an API key
 * Query params: range=today|7d|30d
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Parse range parameter
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "today"

    const now = new Date()
    let startDate: Date

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "today":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Convert dates to timestamps for SQLite compatibility
    const startDateTimestamp = startDate.getTime()
    const todayStartTimestamp = todayStart.getTime()
    const monthStartTimestamp = monthStart.getTime()

    // Get usage counts
    const todayCount = await db
      .select({ count: count() })
      .from(apiKeyUsages)
      .where(
        and(
          eq(apiKeyUsages.apiKeyId, apiKeyId),
          sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(todayStartTimestamp))}`,
          isNull(apiKeyUsages.deletedAt)
        )
      )
      .then((rows) => rows[0]?.count || 0)

    const monthCount = await db
      .select({ count: count() })
      .from(apiKeyUsages)
      .where(
        and(
          eq(apiKeyUsages.apiKeyId, apiKeyId),
          sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(monthStartTimestamp))}`,
          isNull(apiKeyUsages.deletedAt)
        )
      )
      .then((rows) => rows[0]?.count || 0)

    // Get success vs error counts
    const successCount = await db
      .select({ count: count() })
      .from(apiKeyUsages)
      .where(
        and(
          eq(apiKeyUsages.apiKeyId, apiKeyId),
          eq(apiKeyUsages.success, true),
          isNull(apiKeyUsages.deletedAt)
        )
      )
      .then((rows) => rows[0]?.count || 0)

    const errorCount = await db
      .select({ count: count() })
      .from(apiKeyUsages)
      .where(
        and(
          eq(apiKeyUsages.apiKeyId, apiKeyId),
          eq(apiKeyUsages.success, false),
          isNull(apiKeyUsages.deletedAt)
        )
      )
      .then((rows) => rows[0]?.count || 0)

    // Get hourly usage for the selected range
    // Note: SQLite uses different date functions than Postgres
    // This will work for SQLite, but needs adjustment for Postgres
    const isPostgres = process.env.DATABASE_URL?.startsWith("postgres")
    
    let hourlyUsage: Array<{ hour: string; count: number }>
    
    if (isPostgres) {
      // Postgres query - timestamp is already a Date object
      hourlyUsage = await db
        .select({
          hour: sql<string>`EXTRACT(HOUR FROM ${apiKeyUsages.timestamp})::text`.as("hour"),
          count: count(),
        })
        .from(apiKeyUsages)
        .where(
          and(
            eq(apiKeyUsages.apiKeyId, apiKeyId),
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(startDateTimestamp))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .groupBy(sql`EXTRACT(HOUR FROM ${apiKeyUsages.timestamp})`)
        .orderBy(sql`hour ASC`)
    } else {
      // SQLite query
      hourlyUsage = await db
        .select({
          hour: sql<string>`strftime('%H', datetime(${apiKeyUsages.timestamp}/1000, 'unixepoch'))`.as("hour"),
          count: count(),
        })
        .from(apiKeyUsages)
        .where(
          and(
            eq(apiKeyUsages.apiKeyId, apiKeyId),
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(startDateTimestamp))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
        .groupBy(sql`strftime('%H', datetime(${apiKeyUsages.timestamp}/1000, 'unixepoch'))`)
        .orderBy(sql`hour ASC`)
    }

    // Get average latency
    const avgLatencyResult = await db
      .select({
        avgLatency: sql<number>`AVG(${apiKeyUsages.latencyMs})`.as("avgLatency"),
      })
      .from(apiKeyUsages)
        .where(
          and(
            eq(apiKeyUsages.apiKeyId, apiKeyId),
            sql`${apiKeyUsages.timestamp} >= ${sql.raw(String(startDateTimestamp))}`,
            isNull(apiKeyUsages.deletedAt)
          )
        )
      .then((rows) => rows[0]?.avgLatency || 0)

    // Get most used routes
    const routeStats = await db
      .select({
        route: apiKeyUsages.route,
        count: count(),
      })
      .from(apiKeyUsages)
      .where(and(eq(apiKeyUsages.apiKeyId, apiKeyId), isNull(apiKeyUsages.deletedAt)))
      .groupBy(apiKeyUsages.route)
      .orderBy(sql`${count()} DESC`)
      .limit(10)

    return NextResponse.json({
      range,
      today: todayCount,
      thisMonth: monthCount,
      total: successCount + errorCount,
      success: successCount,
      errors: errorCount,
      avgLatency: Math.round(avgLatencyResult),
      callsPerHour: hourlyUsage.map((stat) => ({
        hour: parseInt(stat.hour),
        count: stat.count,
      })),
      topRoutes: routeStats.map((stat) => ({
        route: stat.route,
        count: stat.count,
      })),
    })
  } catch (error: any) {
    console.error("[API-KEYS] Error getting usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

