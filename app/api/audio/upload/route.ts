import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration } from "@/lib/ffmpeg"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("audio") as File
    const title = (formData.get("title") as string) || ""
    const tags = (formData.get("tags") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "File must be an audio file" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}_${originalName}`
    const filePath = path.join(uploadsDir, filename)

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Extract audio duration using ffmpeg
    let duration: number | null = null
    try {
      const durationSeconds = await getAudioDuration(filePath)
      duration = Math.round(durationSeconds) // Convert to integer seconds
    } catch (error) {
      console.error("Failed to extract audio duration:", error)
      // Continue without duration
    }

    // Generate URL for the file
    const url = `/uploads/${filename}`

    // Use provided title or fallback to filename
    const audioTitle = title.trim() || originalName.replace(/\.[^/.]+$/, "")

    // Save to database
    const audio = await db.audios.create({
      title: audioTitle,
      tags: tags?.trim() || null,
      url,
      duration,
    })

    return NextResponse.json({
      id: audio.id,
      title: audio.title,
      url: audio.url,
      duration: audio.duration,
    })
  } catch (error: any) {
    console.error("Audio upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload audio" },
      { status: 500 }
    )
  }
}

