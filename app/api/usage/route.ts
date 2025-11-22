import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Get usage statistics for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usage = await db.usage.getOrCreate(session.user.id)

    return NextResponse.json(usage)
  } catch (error: any) {
    console.error("Error fetching usage:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 }
    )
  }
}
