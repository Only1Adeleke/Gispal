import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const source = searchParams.get("source") || ""

    const mixes = await db.mixes.findAll()
    const allUsers = await db.users.findAll()

    // Add user email to each mix
    let mixesWithUsers = mixes.map((mix) => {
      const user = allUsers.find((u) => u.id === mix.userId)
      const sourceType =
        mix.audioUrl?.includes("youtube.com") || mix.audioUrl?.includes("youtu.be")
          ? "youtube"
          : mix.audioUrl?.includes("audiomack.com")
          ? "audiomack"
          : "upload"
      return {
        ...mix,
        userEmail: user?.email || "Unknown",
        userPlan: user?.plan || "free",
        source: sourceType,
      }
    })

    // Apply filters
    if (source && source !== "all") {
      mixesWithUsers = mixesWithUsers.filter((mix: any) => mix.source === source)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      mixesWithUsers = mixesWithUsers.filter((mix: any) =>
        mix.userEmail.toLowerCase().includes(searchLower) ||
        mix.audioUrl?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const total = mixesWithUsers.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedMixes = mixesWithUsers.slice(start, end)

    return NextResponse.json({
      data: paginatedMixes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const mixId = searchParams.get("mixId")

    if (!mixId) {
      return NextResponse.json(
        { error: "mixId is required" },
        { status: 400 }
      )
    }

    await db.mixes.delete(mixId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

