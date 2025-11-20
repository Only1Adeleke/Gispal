import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jingles = await db.jingles.findByUserId(session.user.id)
    return NextResponse.json(jingles)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch jingles" },
      { status: 500 }
    )
  }
}

