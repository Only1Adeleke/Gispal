import { NextRequest, NextResponse } from "next/server"
import { auth, getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { downloadAudiomackAudio, parseAudiomackUrl } from "@/lib/audiomack"
import { randomUUID } from "crypto"
import fs from "fs"
import { promises as fsPromises } from "fs"
import path from "path"
import NodeID3, { Tags } from "node-id3"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
// @ts-ignore - ffprobe-static doesn't have types
// @ts-ignore - ffprobe-static doesn't have types
import ffprobeStatic from "ffprobe-static"

// Set ffmpeg and ffprobe paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

if (ffprobeStatic) {
  const ffprobePath = typeof ffprobeStatic === "string" ? ffprobeStatic : ffprobeStatic.path
  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath)
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Ingest audio from Audiomack
 * POST /api/audio/audiomack-ingest
 * 
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  console.log("[AUDIOMACK-INGEST] ========== START ==========")
  console.log("[AUDIOMACK-INGEST] Request URL:", request.url)
  console.log("[AUDIOMACK-INGEST] Request method: POST")
  
  try {
    // Check authentication
    console.log("[AUDIOMACK-INGEST] Checking authentication...")
    const session = await getSession(request)
    
    if (!session || !session.user) {
      console.error("[AUDIOMACK-INGEST] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[AUDIOMACK-INGEST] User authenticated:", session.user.id)

    console.log("[AUDIOMACK-INGEST] Parsing request body...")
    const body = await request.json()
    const { url } = body
    
    console.log("[AUDIOMACK-INGEST] Request body URL:", url)

    if (!url || typeof url !== "string") {
      console.error("[AUDIOMACK-INGEST] Invalid URL in request body")
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate Audiomack URL
    console.log("[AUDIOMACK-INGEST] Validating Audiomack URL...")
    const parsed = parseAudiomackUrl(url)
    if (!parsed) {
      console.error("[AUDIOMACK-INGEST] Invalid Audiomack URL format:", url)
      return NextResponse.json(
        { error: "Invalid Audiomack URL format" },
        { status: 400 }
      )
    }

    console.log("[AUDIOMACK-INGEST] Starting ingestion for URL:", url)
    console.log("[AUDIOMACK-INGEST] Parsed:", parsed)
    console.log("[AUDIOMACK-INGEST] Artist slug:", parsed.artistSlug)
    console.log("[AUDIOMACK-INGEST] Track slug:", parsed.trackSlug)
    console.log("[AUDIOMACK-INGEST] Type:", parsed.type)

    // Download audio from Audiomack
    console.log("[AUDIOMACK-INGEST] Downloading audio from Audiomack...")
    console.log("[AUDIOMACK-INGEST] User ID for OAuth (if needed):", session.user.id)
    
    let buffer: Buffer
    let title: string
    let artist: string
    let coverArt: string | undefined
    
    try {
      const result = await downloadAudiomackAudio(url, session.user.id)
      buffer = result.buffer
      title = result.title
      artist = result.artist
      coverArt = result.coverArt
    } catch (downloadError: any) {
      console.error("[AUDIOMACK-INGEST] Download error:", downloadError.message)
      console.error("[AUDIOMACK-INGEST] Download error stack:", downloadError.stack)
      
      // Check if it's a credentials error - if so, provide helpful message
      if (downloadError.message.includes("OAuth credentials not configured")) {
        return NextResponse.json(
          { 
            error: "Audiomack OAuth credentials not configured. Public tracks should work without OAuth. Please check your environment variables.",
            details: downloadError.message
          },
          { status: 500 }
        )
      }
      
      throw downloadError
    }

    console.log("[AUDIOMACK-INGEST] Audio downloaded successfully")
    console.log("[AUDIOMACK-INGEST] Downloaded audio, size:", buffer.length, "bytes")
    console.log("[AUDIOMACK-INGEST] Title:", title)
    console.log("[AUDIOMACK-INGEST] Artist:", artist)
    console.log("[AUDIOMACK-INGEST] Cover art URL:", coverArt || "none")

    // Generate UUID for final file
    const uuid = randomUUID()
    const outputFilename = `final-${uuid}.mp3`
    const uploadsDir = path.join(process.cwd(), "uploads")

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log("[AUDIOMACK-INGEST] Created uploads directory")
    }

    // Save audio to temporary file first
    const tempPath = path.join(process.cwd(), "tmp", "gispal", `audiomack-${uuid}.mp3`)
    const tempDir = path.dirname(tempPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    await fsPromises.writeFile(tempPath, buffer)
    console.log("[AUDIOMACK-INGEST] Saved to temp file:", tempPath)

    // Process metadata and cover art
    const absoluteOutputPath = path.join(uploadsDir, outputFilename)
    
    // Handle cover art if available
    let coverArtPath: string | undefined
    if (coverArt) {
      try {
        // Download cover art
        const coverResponse = await fetch(coverArt)
        if (coverResponse.ok) {
          const coverBuffer = Buffer.from(await coverResponse.arrayBuffer())
          
          // Save cover art to storage
          const coverArtDir = path.join(process.cwd(), "storage", "cover-art", session.user.id)
          if (!fs.existsSync(coverArtDir)) {
            fs.mkdirSync(coverArtDir, { recursive: true })
          }
          
          const coverArtFilename = `${uuid}.jpg`
          const coverArtFilePath = path.join(coverArtDir, coverArtFilename)
          await fsPromises.writeFile(coverArtFilePath, coverBuffer)
          
          coverArtPath = `/storage/cover-art/${session.user.id}/${coverArtFilename}`
          console.log("[AUDIOMACK-INGEST] Downloaded and saved cover art:", coverArtPath)
        }
      } catch (coverError) {
        console.warn("[AUDIOMACK-INGEST] Failed to download cover art:", coverError)
      }
    }

    // Process metadata and embed cover art
    console.log("[AUDIOMACK-INGEST] Processing metadata...")
    
    // Copy temp file to output
    await fsPromises.copyFile(tempPath, absoluteOutputPath)
    
    // Prepare metadata tags
    const tags: Tags = {
      title,
      artist: artist || undefined,
      year: new Date().getFullYear().toString(),
    }
    
    // Add cover art if available
    if (coverArtPath) {
      const absoluteCoverPath = path.resolve(coverArtPath)
      if (fs.existsSync(absoluteCoverPath)) {
        const coverBuffer = await fsPromises.readFile(absoluteCoverPath)
        tags.image = {
          mime: "image/jpeg",
          type: { id: 3, name: "front cover" },
          description: "Cover",
          imageBuffer: coverBuffer,
        }
        console.log("[AUDIOMACK-INGEST] Added cover art to tags")
      }
    }
    
    // Update metadata
    NodeID3.update(tags, absoluteOutputPath)
    
    // Run ffmpeg pass if cover art exists
    if (coverArtPath && fs.existsSync(path.resolve(coverArtPath))) {
      const absoluteCoverPath = path.resolve(coverArtPath)
      const ffmpegOutputPath = absoluteOutputPath + '.tmp.mp3'
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(absoluteOutputPath)
          .input(absoluteCoverPath)
          .outputOptions([
            '-map', '0:a',
            '-map', '1:v',
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            '-c:v', 'mjpeg',
            '-id3v2_version', '3',
            '-write_id3v1', '1',
            '-y'
          ])
          .output(ffmpegOutputPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run()
      })
      
      // Replace original with ffmpeg output
      await fsPromises.unlink(absoluteOutputPath)
      await fsPromises.rename(ffmpegOutputPath, absoluteOutputPath)
      console.log("[AUDIOMACK-INGEST] Applied ffmpeg re-encode with cover art")
    }

    // Clean up temp file
    try {
      await fsPromises.unlink(tempPath)
      console.log("[AUDIOMACK-INGEST] Cleaned up temp file")
    } catch (error) {
      console.warn("[AUDIOMACK-INGEST] Failed to clean up temp file:", error)
    }

    // Get duration
    let duration = 0
    try {
      const { getAudioDuration } = await import("@/lib/ffmpeg")
      const durationSeconds = await getAudioDuration(absoluteOutputPath)
      duration = Math.round(durationSeconds)
    } catch (error) {
      console.warn("[AUDIOMACK-INGEST] Failed to get duration:", error)
    }

    // Save to database
    const audio = await db.audios.create({
      title,
      tags: null,
      url: `/uploads/${outputFilename}`,
      duration,
      artist: artist || undefined,
      album: undefined,
      producer: undefined,
      year: new Date().getFullYear().toString(),
      coverArt: coverArtPath || null,
    }, uuid)

    console.log("[AUDIOMACK-INGEST] Audio saved to database, ID:", audio.id)

    // Record usage
    try {
      const fileSize = (await fsPromises.stat(absoluteOutputPath)).size
      await db.usage.record(session.user.id, "upload", {
        audioId: audio.id,
        duration,
        fileSize,
      })
    } catch (usageError) {
      console.warn("[AUDIOMACK-INGEST] Failed to record usage:", usageError)
    }

    return NextResponse.json({
      success: true,
      audio: {
        id: audio.id,
        title: audio.title,
        artist: audio.artist,
        url: audio.url,
        duration: audio.duration,
        coverArt: audio.coverArt,
      },
    })
  } catch (error: any) {
    console.error("[AUDIOMACK-INGEST] ========== ERROR ==========")
    console.error("[AUDIOMACK-INGEST] Error message:", error.message)
    console.error("[AUDIOMACK-INGEST] Error stack:", error.stack)
    console.error("[AUDIOMACK-INGEST] Error name:", error.name)
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to ingest audio from Audiomack"
    let statusCode = 500
    
    if (error.message.includes("OAuth credentials not configured")) {
      errorMessage = "Audiomack OAuth credentials not configured. Public tracks should work without OAuth. Please check your environment variables."
      statusCode = 500
    } else if (error.message.includes("Invalid Audiomack URL")) {
      statusCode = 400
    } else if (error.message.includes("Track not found")) {
      statusCode = 404
    } else if (error.message.includes("Unauthorized")) {
      statusCode = 401
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: statusCode }
    )
  }
}

