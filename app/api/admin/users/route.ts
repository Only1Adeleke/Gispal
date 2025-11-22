import { NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const plan = searchParams.get("plan") || ""
    const banned = searchParams.get("banned") || ""

    let users = await db.users.findAll()
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          (user.name && user.name.toLowerCase().includes(searchLower))
      )
    }

    if (role) {
      users = users.filter((user) => user.role === role)
    }

    if (plan) {
      users = users.filter((user) => user.plan === plan)
    }

    if (banned === "true") {
      users = users.filter((user) => user.banned === true)
    } else if (banned === "false") {
      users = users.filter((user) => user.banned === false)
    }

    // Get mixes count for each user
    const allMixes = await db.mixes.findAll()
    const mixesCount: Record<string, number> = {}
    allMixes.forEach((mix) => {
      mixesCount[mix.userId] = (mixesCount[mix.userId] || 0) + 1
    })

    const usersWithStats = users.map((user) => ({
      ...user,
      mixesCount: mixesCount[user.id] || 0,
    }))

    // Pagination
    const total = usersWithStats.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = usersWithStats.slice(start, end)

    return NextResponse.json({
      data: paginatedUsers,
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

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    const user = await db.users.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const updated = await db.users.update(userId, updates)

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Prevent deleting yourself
    if (userId === adminCheck.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const user = await db.users.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Delete user's jingles, cover arts, and mixes
    const userJingles = await db.jingles.findByUserId(userId)
    for (const jingle of userJingles) {
      await db.jingles.delete(jingle.id)
    }

    const userCoverArts = await db.coverArts.findByUserId(userId)
    for (const coverArt of userCoverArts) {
      await db.coverArts.delete(coverArt.id)
    }

    const userMixes = await db.mixes.findByUserId(userId)
    for (const mix of userMixes) {
      await db.mixes.delete(mix.id)
    }

    // Delete user's usage data
    await db.usage.delete(userId)

    // Delete user
    await db.users.delete(userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

