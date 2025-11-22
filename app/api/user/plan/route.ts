import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMaxJingles, getMaxCoverArts } from "@/lib/plan-restrictions"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create user in our database
    let user = await db.users.findById(session.user.id)
    if (!user) {
      // Create user in our database if they don't exist (first time accessing)
      try {
        user = await db.users.create(
          {
            email: session.user.email || "",
            name: session.user.name || undefined,
            plan: "free",
            bandwidthLimit: 100 * 1024 * 1024, // 100MB default
          },
          session.user.id // Use Better Auth's user ID
        )
        // Set first user as admin
        const allUsers = await db.users.findAll()
        if (allUsers.length === 1) {
          user = await db.users.update(user.id, { role: "admin" })
        }
      } catch (error: any) {
        console.error("Error creating user:", error)
        return NextResponse.json(
          { error: "Failed to initialize user account" },
          { status: 500 }
        )
      }
    }

    const jingles = await db.jingles.findByUserId(session.user.id)
    const coverArts = await db.coverArts.findByUserId(session.user.id)

    return NextResponse.json({
      plan: user.plan,
      role: user.role,
      jingleCount: jingles.length,
      maxJingles: getMaxJingles(user.plan),
      coverArtCount: coverArts.length,
      maxCoverArts: getMaxCoverArts(user.plan),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch plan info" },
      { status: 500 }
    )
  }
}

