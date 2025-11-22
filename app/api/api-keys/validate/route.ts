import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST - Validate an API key (used by WordPress plugin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    const key = await db.apiKeys.findByKey(apiKey)

    if (!key || !key.active) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await db.apiKeys.update(key.id, {
      lastUsedAt: Date.now(),
      usageCount: key.usageCount + 1,
    })

    // Get user info
    const user = await db.users.findById(key.userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      userId: user.id,
      plan: user.plan,
    })
  } catch (error: any) {
    console.error("Error validating API key:", error)
    return NextResponse.json(
      { error: error.message || "Failed to validate API key" },
      { status: 500 }
    )
  }
}
