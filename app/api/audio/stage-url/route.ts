import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAudioDuration, extractCoverArt } from "@/lib/ffmpeg"
import { tempStorage } from "@/lib/storage"
import { downloadAudiomackAudio } from "@/lib/audiomack"
import ytdl from "ytdl-core"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type IngestSource = "mp3-url" | "youtube" | "audiomack"

interface StageRequest {
  source: IngestSource
  url: string
}

function isValidAudiomackUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes("audiomack.com")
  } catch {
    return false
  }
}

function isValidMp3Url(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.toLowerCase().endsWith(".mp3") || 
           urlObj.searchParams.get("format") === "mp3" ||
           url.startsWith("http")
  } catch {
    return false
  }
}

// Stage an audio file from URL
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: StageRequest = await request.json()
    const { source, url } = body

    if (!source || !url) {
      return NextResponse.json(
        { error: "Source and URL are required" },
        { status: 400 }
      )
    }

    if (!["mp3-url", "youtube", "audiomack"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source. Must be 'mp3-url', 'youtube', or 'audiomack'" },
        { status: 400 }
      )
    }

    let audioBuffer: Buffer | null = null
    let extractedTitle: string | undefined
    let extractedMetadata: any = {}

    // Download audio based on source
    switch (source) {
      case "mp3-url": {
        if (!isValidMp3Url(url)) {
          return NextResponse.json(
            { error: "Invalid MP3 URL format" },
            { status: 400 }
          )
        }

        try {
          const response = await fetch(url)
          if (!response.ok) {
            return NextResponse.json(
              { error: `Failed to download MP3: ${response.statusText}` },
              { status: response.status }
            )
          }

          const contentType = response.headers.get("content-type") || ""
          if (!contentType.startsWith("audio/") && !url.toLowerCase().endsWith(".mp3")) {
            return NextResponse.json(
              { error: "URL does not point to an audio file" },
              { status: 415 }
            )
          }

          const arrayBuffer = await response.arrayBuffer()
          audioBuffer = Buffer.from(arrayBuffer)

          try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname
            extractedTitle = path.basename(pathname).replace(/\.[^/.]+$/, "")
          } catch {
            extractedTitle = "Imported Audio"
          }
        } catch (error: any) {
          console.error("MP3 download error:", error)
          return NextResponse.json(
            { error: `Failed to download MP3: ${error.message}` },
            { status: 500 }
          )
        }
        break
      }

      case "youtube": {
        if (!ytdl.validateURL(url)) {
          return NextResponse.json(
            { error: "Invalid YouTube URL" },
            { status: 400 }
          )
        }

        try {
          const info = await ytdl.getInfo(url)
          extractedTitle = info.videoDetails.title
          extractedMetadata = {
            artist: info.videoDetails.author?.name,
            channel: info.videoDetails.author?.name,
          }

          const audioFormat = ytdl.chooseFormat(info.formats, {
            quality: "highestaudio",
            filter: "audioonly",
          })

          if (!audioFormat) {
            return NextResponse.json(
              { error: "No audio format available for this video" },
              { status: 415 }
            )
          }

          const chunks: Buffer[] = []
          const stream = ytdl.downloadFromInfo(info, { format: audioFormat })
          
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk))
          }
          audioBuffer = Buffer.concat(chunks)
        } catch (error: any) {
          console.error("YouTube download error:", error)
          return NextResponse.json(
            { error: `Failed to download from YouTube: ${error.message}` },
            { status: 500 }
          )
        }
        break
      }

      case "audiomack": {
        if (!isValidAudiomackUrl(url)) {
          return NextResponse.json(
            { error: "Invalid Audiomack URL" },
            { status: 400 }
          )
        }

        try {
          const result = await downloadAudiomackAudio(url)
          audioBuffer = result.buffer
          extractedTitle = result.title
          extractedMetadata = {
            artist: result.artist,
          }
        } catch (error: any) {
          console.error("Audiomack download error:", error)
          return NextResponse.json(
            { error: `Failed to download from Audiomack: ${error.message}` },
            { status: 500 }
          )
        }
        break
      }

      default:
        return NextResponse.json(
          { error: "Unsupported source" },
          { status: 400 }
        )
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "Failed to download audio" },
        { status: 500 }
      )
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Save to staging
    const stagingId = randomUUID()
    const filename = `staged_${stagingId}.mp3`
    const stagingPath = await tempStorage.save(audioBuffer, filename)

    // Extract metadata
    let duration: number | null = null
    let extractedCoverArt: string | null = null

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

    // Use extracted title or fallback
    extractedMetadata.title = extractedTitle || "Imported Audio"

    return NextResponse.json({
      stagingId,
      stagingUrl: `/api/temp/${filename}`,
      duration,
      extractedCoverArt,
      extractedMetadata,
      filename: extractedTitle || "imported.mp3",
    })
  } catch (error: any) {
    console.error("Staging URL error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to stage audio" },
      { status: 500 }
    )
  }
}

