import { NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth/api-keys"
import { db } from "@/lib/db"
import { canFullExport, isProPlan } from "@/lib/plan-restrictions"

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const userId = await verifyApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = await db.users.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { mixId, saveToMediaLibrary } = await request.json()

    if (!mixId) {
      return NextResponse.json({ error: "mixId is required" }, { status: 400 })
    }

    // Check if user can export (Pro only)
    if (!canFullExport(user.plan)) {
      return NextResponse.json(
        { error: "Full export is only available for Pro plans" },
        { status: 403 }
      )
    }

    // Get mix record
    // Note: In production, you'd have a proper mix lookup
    // For now, this is a placeholder
    
    return NextResponse.json({
      success: true,
      message: "Export functionality - to be implemented with WordPress Media Library integration",
      data: {
        mixId,
        saveToMediaLibrary: saveToMediaLibrary || false,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export" },
      { status: 500 }
    )
  }
}

