import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Generate a secure API key
function generateApiKey(): string {
  return `gispal_${randomBytes(32).toString("hex")}`
}

// GET - List all API keys for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keys = await db.apiKeys.findByUserId(session.user.id)
    
    // Don't return the full key, only a masked version for security
    const maskedKeys = keys.map((key) => ({
      id: key.id,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
      fullKey: key.key, // Include full key only on creation
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      active: key.active,
    }))

    return NextResponse.json(maskedKeys)
  } catch (error: any) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
      { status: 500 }
    )
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = generateApiKey()
    const newKey = await db.apiKeys.create({
      userId: session.user.id,
      key: apiKey,
      createdAt: Date.now(),
      usageCount: 0,
      active: true,
    })

    return NextResponse.json({
      id: newKey.id,
      key: newKey.key, // Return full key only on creation
      createdAt: newKey.createdAt,
      lastUsedAt: newKey.lastUsedAt,
      usageCount: newKey.usageCount,
      active: newKey.active,
    })
  } catch (error: any) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create API key" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get("id")

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      )
    }

    // Verify the key belongs to the user
    const keys = await db.apiKeys.findByUserId(session.user.id)
    const key = keys.find((k) => k.id === keyId)

    if (!key) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    await db.apiKeys.delete(keyId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting API key:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete API key" },
      { status: 500 }
    )
  }
}
