import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

    let audioBuffer: Buffer
    let coverArtUrl: string | null = null

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

      // Extract cover art from video thumbnail
      const thumbnailUrl = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url
      if (thumbnailUrl) {
        coverArtUrl = thumbnailUrl
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

    // Try to extract cover art from audio file
    try {
      const coverPath = await extractCoverArt(audioPath)
      if (coverPath) {
        const coverFilename = path.basename(coverPath)
        coverArtUrl = `/api/temp/${coverFilename}`
      }
    } catch (error) {
      // Cover art extraction failed, use provided URL if available
    }

    return NextResponse.json({
      audioUrl,
      coverArtUrl,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to extract audio" },
      { status: 500 }
    )
  }
}

