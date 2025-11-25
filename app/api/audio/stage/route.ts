import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAudioDuration, extractCoverArt } from "@/lib/ffmpeg"
import { tempStorage } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Stage an uploaded file
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("audio") as File

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
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

    // Save to staging
    const buffer = Buffer.from(await file.arrayBuffer())
    const stagingId = randomUUID()
    const filename = `staged_${stagingId}.mp3`
    const stagingPath = await tempStorage.save(buffer, filename)

    // Extract metadata
    let duration: number | null = null
    let extractedCoverArt: string | null = null
    let extractedMetadata: any = {}

    try {
      duration = await getAudioDuration(stagingPath)
      duration = Math.round(duration)
    } catch (error) {
      console.error("Failed to extract duration:", error)
    }

    // Extract cover art
    try {
      const coverArtPath = await extractCoverArt(stagingPath)
      if (coverArtPath) {
        const coverFilename = path.basename(coverArtPath)
        extractedCoverArt = `/api/temp/${coverFilename}`
      }
    } catch (error) {
      console.error("Failed to extract cover art:", error)
    }

    // Extract basic metadata from filename
    const originalName = file.name.replace(/\.[^/.]+$/, "")
    extractedMetadata = {
      title: originalName,
    }

    return NextResponse.json({
      stagingId,
      stagingUrl: `/api/temp/${filename}`,
      duration,
      extractedCoverArt,
      extractedMetadata,
      filename: file.name,
    })
  } catch (error: any) {
    console.error("Staging error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to stage audio" },
      { status: 500 }
    )
  }
}

