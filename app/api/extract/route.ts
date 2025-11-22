import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUseExtractedCoverArt } from "@/lib/plan-restrictions"
import ytdl from "ytdl-core"
import { extractCoverArt } from "@/lib/ffmpeg"
import { tempStorage } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Get or create user in our database
    let user = await db.users.findById(session.user.id)
    if (!user) {
      try {
        user = await db.users.create(
          {
            email: session.user.email || "",
            name: session.user.name || undefined,
            plan: "free",
            bandwidthLimit: 100 * 1024 * 1024, // 100MB default
          },
          session.user.id // Use Better Auth's user ID
        )
        const allUsers = await db.users.findAll()
        if (allUsers.length === 1) {
          user = await db.users.update(user.id, { role: "admin" })
        }
      } catch (error) {
        console.error("Error creating user in extract route:", error)
        return NextResponse.json(
          { error: "Failed to initialize user data" },
          { status: 500 }
        )
      }
    }

    let audioBuffer: Buffer
    let coverArtUrl: string | null = null
    let extractedMetadata: any = {}

    // Detect platform and download
    if (ytdl.validateURL(url)) {
      // YouTube
      const info = await ytdl.getInfo(url)
      const audioFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      })

      const chunks: Buffer[] = []
      const stream = ytdl.downloadFromInfo(info, { format: audioFormat })
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }
      audioBuffer = Buffer.concat(chunks)

      // Extract metadata
      extractedMetadata = {
        title: info.videoDetails.title,
        artist: info.videoDetails.author?.name,
        album: info.videoDetails.title,
      }

      // Extract cover art from video thumbnail (only for Pro users)
      if (canUseExtractedCoverArt(user.plan)) {
        const thumbnailUrl = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url
        if (thumbnailUrl) {
          coverArtUrl = thumbnailUrl
        }
      }
    } else if (url.includes("audiomack.com")) {
      // Audiomack - would need specific implementation
      // For now, return error
      return NextResponse.json(
        { error: "Audiomack extraction not yet implemented" },
        { status: 501 }
      )
    } else {
      // Direct MP3 URL
      const response = await fetch(url)
      audioBuffer = Buffer.from(await response.arrayBuffer())
    }

    // Save audio to temp storage
    const audioFilename = `extracted_${Date.now()}.mp3`
    const audioPath = await tempStorage.save(audioBuffer, audioFilename)
    const audioUrl = `/api/temp/${audioFilename}`

    // Try to extract cover art from audio file (only for Pro users)
    if (canUseExtractedCoverArt(user.plan)) {
      try {
        const coverPath = await extractCoverArt(audioPath)
        if (coverPath) {
          const coverFilename = path.basename(coverPath)
          coverArtUrl = `/api/temp/${coverFilename}`
        }
      } catch (error) {
        // Cover art extraction failed, use provided URL if available
      }
    }

    return NextResponse.json({
      audioUrl,
      coverArtUrl: canUseExtractedCoverArt(user.plan) ? coverArtUrl : null,
      metadata: extractedMetadata,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to extract audio" },
      { status: 500 }
    )
  }
}

