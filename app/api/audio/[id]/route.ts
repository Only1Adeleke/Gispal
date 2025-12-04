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
    const uploadsDir = path.join(process.cwd(), "uploads")
    
    // Ensure uploads directory exists
    if (!fsSync.existsSync(uploadsDir)) {
      fsSync.mkdirSync(uploadsDir, { recursive: true })
      console.log("[DOWNLOAD] Created uploads directory:", uploadsDir)
    }
    
    const filePath = path.join(uploadsDir, filename)
    const absoluteFilePath = path.resolve(filePath)

    console.log("[DOWNLOAD] Reconstructed file path:", absoluteFilePath)
    console.log("[DOWNLOAD] Uploads directory:", uploadsDir)
    console.log("[DOWNLOAD] File exists check:", fsSync.existsSync(absoluteFilePath))
    
    // Check if file exists using fs.existsSync
    if (!fsSync.existsSync(absoluteFilePath)) {
      console.error("[DOWNLOAD] File not found at path:", absoluteFilePath)
      console.error("[DOWNLOAD] Current working directory:", process.cwd())
      console.error("[DOWNLOAD] Uploads directory contents:", fsSync.existsSync(uploadsDir) ? fsSync.readdirSync(uploadsDir).slice(0, 5).join(", ") : "directory does not exist")
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    console.log("[DOWNLOAD] File exists, reading...")

    // Read file using absolute path
    const fileBuffer = await fs.readFile(absoluteFilePath)
    console.log("[DOWNLOAD] File read successfully, size:", fileBuffer.length, "bytes")
    
    if (fileBuffer.length === 0) {
      console.error("[DOWNLOAD] File is empty!")
      return NextResponse.json({ error: "Audio file is empty" }, { status: 500 })
    }

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
    console.log("[DOWNLOAD] Serving file with headers:")
    console.log("[DOWNLOAD]   - Content-Type: audio/mpeg")
    console.log("[DOWNLOAD]   - Content-Length:", fileBuffer.length)
    console.log("[DOWNLOAD]   - Filename:", filename)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache",
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

