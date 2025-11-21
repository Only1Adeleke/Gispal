import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all audio files
    const audios = await db.audios.findAll()

    return NextResponse.json(audios)
  } catch (error: any) {
    console.error("Error fetching audio files:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch audio files" },
      { status: 500 }
    )
  }
}

