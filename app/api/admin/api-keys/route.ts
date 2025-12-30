/**
 * Admin API Routes for API Key management
 * GET: List all API keys (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { adminOnly } from "@/lib/api/middleware/adminGuard"
import { db } from "@/lib/db/drizzle"
import { apiKeys, users } from "@/lib/db/schema"
import { eq, and, isNull, or, like, gte, lte, desc, sql, count } from "drizzle-orm"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const listApiKeysSchema = z.object({
  status: z.enum(["active", "revoked", "expired", "all"]).optional().default("all"),
  search: z.string().optional(),
  searchType: z.enum(["email", "prefix"]).optional(),
  minUsage: z.number().int().optional(),
  maxUsage: z.number().int().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
})

/**
 * GET /api/admin/api-keys
 * List all API keys with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await adminOnly(request)
    if (!adminCheck.success) {
      return adminCheck.response
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const params = {
      status: searchParams.get("status") || "all",
      search: searchParams.get("search") || undefined,
      searchType: searchParams.get("searchType") || undefined,
      minUsage: searchParams.get("minUsage") ? parseInt(searchParams.get("minUsage")!) : undefined,
      maxUsage: searchParams.get("maxUsage") ? parseInt(searchParams.get("maxUsage")!) : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    }

    const validated = listApiKeysSchema.parse(params)

    // Build where conditions
    const conditions: any[] = [isNull(apiKeys.deletedAt)]

    // Status filter
    const now = new Date().getTime()
    
    if (validated.status === "revoked") {
      // For revoked, we need to check that revokedAt is not null
      conditions.push(sql`${apiKeys.revokedAt} IS NOT NULL`)
    } else if (validated.status === "expired") {
      conditions.push(and(
        sql`${apiKeys.expiresAt} IS NOT NULL`,
        sql`${apiKeys.expiresAt} <= ${now}`
      ))
    } else if (validated.status === "active") {
      conditions.push(and(
        isNull(apiKeys.revokedAt),
        or(
          isNull(apiKeys.expiresAt),
          sql`${apiKeys.expiresAt} >= ${now}`
        )
      ))
    }

    // Search filter - will be applied after join
    let emailSearch: string | undefined
    let prefixSearch: string | undefined
    
    if (validated.search) {
      if (validated.searchType === "prefix") {
        prefixSearch = validated.search
      } else if (validated.searchType === "email") {
        emailSearch = validated.search
      }
    }

    // Usage count filter
    if (validated.minUsage !== undefined) {
      conditions.push(gte(apiKeys.usageCount, validated.minUsage))
    }
    if (validated.maxUsage !== undefined) {
      conditions.push(lte(apiKeys.usageCount, validated.maxUsage))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Calculate offset
    const offset = (validated.page - 1) * validated.limit

    // Build final where clause with email search
    const finalConditions = [...conditions]
    if (emailSearch) {
      finalConditions.push(like(users.email, `%${emailSearch}%`))
    }
    if (prefixSearch) {
      finalConditions.push(like(apiKeys.prefix, `%${prefixSearch}%`))
    }
    const finalWhereClause = finalConditions.length > 0 ? and(...finalConditions) : undefined

    // Fetch keys with user information
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
        deletedAt: apiKeys.deletedAt,
        usageCount: apiKeys.usageCount,
        rateLimitPerMinute: apiKeys.rateLimitPerMinute,
        rateLimitPerDay: apiKeys.rateLimitPerDay,
        userId: apiKeys.userId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id))
      .where(finalWhereClause)
      .orderBy(desc(apiKeys.createdAt))
      .limit(validated.limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id))
      .where(finalWhereClause)
      .then((rows) => rows[0]?.count || 0)
    
    const totalCount = typeof totalCountResult === "number" ? totalCountResult : 0

    // Format response
    const formattedKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes as string[],
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      deletedAt: key.deletedAt,
      usageCount: key.usageCount || 0,
      rateLimitPerMinute: key.rateLimitPerMinute,
      rateLimitPerDay: key.rateLimitPerDay,
      userId: key.userId,
      userEmail: key.userEmail,
      userName: key.userName,
      status: key.revokedAt
        ? "revoked"
        : key.expiresAt && new Date(key.expiresAt) < new Date()
          ? "expired"
          : "active",
    }))

    return NextResponse.json({
      keys: formattedKeys,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / validated.limit),
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[ADMIN-API-KEYS] Error listing keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

