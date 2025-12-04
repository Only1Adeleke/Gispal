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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get usage counts
    const todayCount = await db
      .select({ count: count() })
      .from(apiKeyUsages)
      .where(
        and(
          eq(apiKeyUsages.apiKeyId, apiKeyId),
          gte(apiKeyUsages.timestamp, todayStart),
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
          gte(apiKeyUsages.timestamp, monthStart),
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
      today: todayCount,
      thisMonth: monthCount,
      total: successCount + errorCount,
      success: successCount,
      errors: errorCount,
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

