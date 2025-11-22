import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration } from "@/lib/ffmpeg"
import { checkLimits, checkExternalIngestDurationLimit } from "@/lib/billing"
import { downloadAudiomackAudio, parseAudiomackUrl } from "@/lib/audiomack"
import ytdl from "ytdl-core"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type IngestSource = "mp3-url" | "youtube" | "audiomack"

interface IngestRequest {
  source: IngestSource
  url: string
  title?: string
  tags?: string
}

// Validate Audiomack URL format
function isValidAudiomackUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes("audiomack.com")
  } catch {
    return false
  }
}

// Validate MP3 URL
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body: IngestRequest = await request.json()
    const { source, url, title, tags } = body

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

    // Get user and check limits
    const user = await db.users.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userUsage = await db.usage.getOrCreate(session.user.id)
    const limits = checkLimits(user, userUsage)

    if (!limits.canIngestExternal) {
      return NextResponse.json(
        { error: limits.reason || "External ingestion not allowed" },
        { status: 403 }
      )
    }

    let audioBuffer: Buffer | null = null
    let extractedTitle: string | undefined
    let extractedMetadata: any = {}

    // Download audio based on source
    switch (source) {
      case "mp3-url": {
        // Validate MP3 URL
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

          // Check content type
          const contentType = response.headers.get("content-type") || ""
          if (!contentType.startsWith("audio/") && !url.toLowerCase().endsWith(".mp3")) {
            return NextResponse.json(
              { error: "URL does not point to an audio file" },
              { status: 415 }
            )
          }

          const arrayBuffer = await response.arrayBuffer()
          audioBuffer = Buffer.from(arrayBuffer)

          // Extract filename from URL for title fallback
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
        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
          return NextResponse.json(
            { error: "Invalid YouTube URL" },
            { status: 400 }
          )
        }

        try {
          // Get video info
          const info = await ytdl.getInfo(url)
          
          // Extract metadata
          extractedTitle = info.videoDetails.title
          extractedMetadata = {
            artist: info.videoDetails.author?.name,
            channel: info.videoDetails.author?.name,
          }

          // Choose highest quality audio format
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

          // Download audio stream
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
        // Validate Audiomack URL
        if (!isValidAudiomackUrl(url)) {
          return NextResponse.json(
            { error: "Invalid Audiomack URL" },
            { status: 400 }
          )
        }

        try {
          // Download audio from Audiomack
          const result = await downloadAudiomackAudio(url)
          audioBuffer = result.buffer
          
          // Use extracted metadata
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

    // Ensure audioBuffer was set
    if (!audioBuffer) {
      return NextResponse.json(
        { error: "Failed to download audio" },
        { status: 500 }
      )
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const extension = source === "youtube" ? "mp3" : path.extname(url) || ".mp3"
    const sanitizedExtension = extension.startsWith(".") ? extension : `.${extension}`
    const filename = `ingested_${timestamp}${sanitizedExtension}`
    const filePath = path.join(uploadsDir, filename)

    // Save file to disk
    await writeFile(filePath, audioBuffer)

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
    const fileUrl = `/uploads/${filename}`

    // Use provided title, extracted title, or fallback
    const audioTitle = title?.trim() || extractedTitle || "Imported Audio"

    // Save to database
    const audio = await db.audios.create({
      title: audioTitle,
      tags: tags?.trim() || null,
      url: fileUrl,
      duration,
    })

    // Record usage
    await db.usage.record(session.user.id, "external_ingest", {
      audioId: audio.id,
      source,
      duration,
      fileSize: audioBuffer.length,
    })

    return NextResponse.json({
      id: audio.id,
      title: audio.title,
      url: audio.url,
      duration: audio.duration,
      tags: audio.tags,
    })
  } catch (error: any) {
    console.error("Audio ingest error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to ingest audio" },
      { status: 500 }
    )
  }
}

