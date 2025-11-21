import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const audioId = params.id

    // Find audio in database
    const audio = await db.audios.findById(audioId)

    if (!audio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "uploads", path.basename(audio.url))
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, continue with database deletion
      console.warn("Failed to delete file:", error)
    }

    // Delete from database
    await db.audios.delete(audioId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting audio:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete audio" },
      { status: 500 }
    )
  }
}

