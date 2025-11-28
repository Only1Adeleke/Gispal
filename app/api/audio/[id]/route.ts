import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import fs from "fs/promises"
import fsSync from "fs"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
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
    console.log("[DOWNLOAD] Requesting audio ID:", audioId)
    
    // ALWAYS reconstruct filename from UUID - DO NOT rely on DB path
    const filename = `final-${audioId}.mp3`
    const filePath = path.join(process.cwd(), "uploads", filename)

    console.log("[DOWNLOAD] Reconstructed file path:", filePath)
    
    // Check if file exists using fs.existsSync
    if (!fsSync.existsSync(filePath)) {
      console.error("[DOWNLOAD] File not found at path:", filePath)
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    console.log("[DOWNLOAD] File exists, reading...")

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    console.log("[DOWNLOAD] File read successfully, size:", fileBuffer.length, "bytes")

    // Record download usage (try to get audio from DB for usage tracking, but don't fail if not found)
    try {
      const audio = await db.audios.findById(audioId)
      if (audio) {
        await db.usage.record(session.user.id, "download", {
          audioId: audio.id,
        })
      }
    } catch (usageError) {
      console.warn("[DOWNLOAD] Failed to record usage:", usageError)
      // Continue with download even if usage recording fails
    }

    // Serve the audio with correct headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("[DOWNLOAD] Error:", error)
    console.error("[DOWNLOAD] Stack:", error.stack)
    return NextResponse.json(
      { error: error.message || "Failed to download audio" },
      { status: 500 }
    )
  }
}

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

