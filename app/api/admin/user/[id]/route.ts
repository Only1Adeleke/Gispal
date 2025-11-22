import { NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await db.users.findById(params.id)
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get user stats
    const jingles = await db.jingles.findByUserId(params.id)
    const coverArts = await db.coverArts.findByUserId(params.id)
    const mixes = await db.mixes.findByUserId(params.id)
    const usage = await db.usage.findById(params.id)

    return NextResponse.json({
      ...user,
      stats: {
        jingles: jingles.length,
        coverArts: coverArts.length,
        mixes: mixes.length,
        totalMixes: usage?.totalMixes || 0,
        totalUploads: usage?.totalUploads || 0,
        totalDownloads: usage?.totalDownloads || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, email, plan, role, banned } = body

    const user = await db.users.findById(params.id)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (plan !== undefined) updates.plan = plan
    if (role !== undefined) updates.role = role
    if (banned !== undefined) updates.banned = banned

    const updated = await db.users.update(params.id, updates)

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

