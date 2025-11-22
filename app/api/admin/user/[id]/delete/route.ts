import { NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Prevent deleting yourself
    if (params.id === adminCheck.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const user = await db.users.findById(params.id)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Delete user's jingles
    const userJingles = await db.jingles.findByUserId(params.id)
    for (const jingle of userJingles) {
      await db.jingles.delete(jingle.id)
    }

    // Delete user's cover arts
    const userCoverArts = await db.coverArts.findByUserId(params.id)
    for (const coverArt of userCoverArts) {
      await db.coverArts.delete(coverArt.id)
    }

    // Delete user's mixes
    const userMixes = await db.mixes.findByUserId(params.id)
    for (const mix of userMixes) {
      await db.mixes.delete(mix.id)
    }

    // Delete user's usage data
    await db.usage.delete(params.id)

    // Delete user
    await db.users.delete(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

