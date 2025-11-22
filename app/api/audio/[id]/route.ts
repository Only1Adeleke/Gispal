import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import fs from "fs/promises"
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
    const audio = await db.audios.findById(audioId)

    if (!audio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    // Record download usage
    await db.usage.record(session.user.id, "download", {
      audioId: audio.id,
    })

    // Return file path for download
    const filePath = path.join(process.cwd(), "uploads", path.basename(audio.url))
    
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    
    const contentTypeMap: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
    }
    
    const contentType = contentTypeMap[ext] || "application/octet-stream"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${audio.title}.mp3"`,
      },
    })
  } catch (error: any) {
    console.error("Error downloading audio:", error)
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

