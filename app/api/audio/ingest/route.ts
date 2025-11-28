import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration, mixAudio, JingleConfig } from "@/lib/ffmpeg"
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

    // Get or create user in our database
    let user = await db.users.findById(session.user.id)
    if (!user) {
      // Create user in our database if they don't exist (first time accessing)
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
        // Set first user as admin
        const allUsers = await db.users.findAll()
        if (allUsers.length === 1) {
          user = await db.users.update(user.id, { role: "admin" })
        }
      } catch (error: any) {
        console.error("Error creating user:", error)
        return NextResponse.json(
          { error: "Failed to initialize user account" },
          { status: 500 }
        )
      }
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

    // Use provided title, extracted title, or fallback
    const audioTitle = title?.trim() || extractedTitle || "Imported Audio"

    // Check if user has jingles and automatically mix
    const userJingles = await db.jingles.findByUserId(session.user.id)
    let finalAudioPath = filePath
    let finalFileUrl = `/uploads/${filename}`
    let finalDuration = duration

    // If user has jingles, automatically mix with them
    if (userJingles.length > 0) {
      try {
        // Prepare jingle configs - use first jingle at the start
        const jingleConfigs: JingleConfig[] = []
        
        for (const jingle of userJingles) {
          // Download jingle file to temp location
          let jinglePath: string
          
          // Check if jingle URL is a local file or needs to be fetched
          if (jingle.fileUrl.startsWith("/")) {
            // Local file - check if it exists in uploads or storage
            const possiblePaths = [
              path.join(process.cwd(), "uploads", path.basename(jingle.fileUrl)),
              path.join(process.cwd(), jingle.fileUrl.replace("/api/storage/", "storage/").replace("/storage/", "storage/")),
            ]
            
            let found = false
            for (const possiblePath of possiblePaths) {
              try {
                await fs.access(possiblePath)
                jinglePath = possiblePath
                found = true
                break
              } catch {
                // Try next path
              }
            }
            
            if (!found) {
              // Try to fetch from URL
              const jingleUrl = jingle.fileUrl.startsWith("http") 
                ? jingle.fileUrl 
                : `http://localhost:3000${jingle.fileUrl}`
              const jingleResponse = await fetch(jingleUrl)
              if (jingleResponse.ok) {
                const jingleBuffer = await jingleResponse.arrayBuffer()
                const tempJinglePath = path.join(process.cwd(), "uploads", `temp_jingle_${Date.now()}.mp3`)
                await writeFile(tempJinglePath, Buffer.from(jingleBuffer))
                jinglePath = tempJinglePath
              } else {
                console.warn(`Could not access jingle file: ${jingle.fileUrl}`)
                continue
              }
            }
          } else {
            // Remote URL - fetch it
            const jingleResponse = await fetch(jingle.fileUrl)
            if (!jingleResponse.ok) {
              console.warn(`Could not fetch jingle from URL: ${jingle.fileUrl}`)
              continue
            }
            const jingleBuffer = await jingleResponse.arrayBuffer()
            const tempJinglePath = path.join(process.cwd(), "uploads", `temp_jingle_${Date.now()}.mp3`)
            await writeFile(tempJinglePath, Buffer.from(jingleBuffer))
            jinglePath = tempJinglePath
          }

          if (jinglePath) {
            jingleConfigs.push({
              path: jinglePath,
              position: "start", // Default to start position
              volume: 1.0, // Default volume
            })
          }
        }

        // Mix audio with jingles
        if (jingleConfigs.length > 0) {
          try {
            // Use the local file path directly (mixAudio accepts file paths)
            const mixedOutputPath = path.join(process.cwd(), "uploads", `mixed_${timestamp}${sanitizedExtension}`)
            
            // Use mixAudio function - it will handle the mixing
            const mixedAudioPath = await mixAudio({
              audioUrl: filePath, // Pass file path directly
              jingles: jingleConfigs,
              previewOnly: false,
            })

            // mixAudio saves to tmp/gispal, so we need to move it to uploads
            try {
              // Try to move the file
              await fs.rename(mixedAudioPath, mixedOutputPath)
            } catch (renameError) {
              // If rename fails (cross-device), copy and delete
              const mixedBuffer = await fs.readFile(mixedAudioPath)
              await writeFile(mixedOutputPath, mixedBuffer)
              await fs.unlink(mixedAudioPath).catch(() => {})
            }

            // Update final paths
            finalAudioPath = mixedOutputPath
            finalFileUrl = `/uploads/${path.basename(mixedOutputPath)}`
            
            // Get duration of mixed audio
            try {
              const mixedDuration = await getAudioDuration(mixedOutputPath)
              finalDuration = Math.round(mixedDuration)
            } catch (error) {
              console.error("Failed to get mixed audio duration:", error)
            }

            // Clean up temp jingle files
            for (const jingleConfig of jingleConfigs) {
              if (jingleConfig.path.includes("temp_jingle_")) {
                await fs.unlink(jingleConfig.path).catch(() => {})
              }
            }
          } catch (mixError: any) {
            console.error("Error during mixing:", mixError)
            // Continue with original audio if mixing fails
            console.log("Falling back to original audio without mixing")
          }
        }
      } catch (error) {
        console.error("Error mixing audio with jingles:", error)
        // Continue with original audio if mixing fails
      }
    }

    // Save to database with the final (mixed) audio
    const audio = await db.audios.create({
      title: audioTitle,
      tags: tags?.trim() || null,
      url: finalFileUrl,
      duration: finalDuration,
    })

    // Record usage
    await db.usage.record(session.user.id, "external_ingest", {
      audioId: audio.id,
      source,
      duration: finalDuration,
      fileSize: audioBuffer.length,
    })

    return NextResponse.json({
      id: audio.id,
      title: audio.title,
      url: audio.url,
      duration: audio.duration,
      tags: audio.tags,
      mixed: userJingles.length > 0,
    })
  } catch (error: any) {
    console.error("Audio ingest error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to ingest audio" },
      { status: 500 }
    )
  }
}

