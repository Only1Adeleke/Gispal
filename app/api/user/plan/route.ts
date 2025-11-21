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

    const user = await db.users.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

