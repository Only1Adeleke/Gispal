import { NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth/api-keys"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const userId = await verifyApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const jingles = await db.jingles.findByUserId(userId)
    return NextResponse.json({
      success: true,
      data: jingles.map((j) => ({
        id: j.id,
        name: j.name,
        url: j.fileUrl,
        duration: j.duration,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch jingles" },
      { status: 500 }
    )
  }
}

