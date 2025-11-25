import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration, mixAudio, extractCoverArt, initializeFfmpegPaths } from "@/lib/ffmpeg"
import { storage, tempStorage } from "@/lib/storage"
import { checkLimits } from "@/lib/billing"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import ffprobeStatic from "ffprobe-static"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"
import { writeFile } from "fs/promises"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Set ffmpeg and ffprobe paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}
if (ffprobeStatic) {
  const ffprobePath = (ffprobeStatic as any).path || ffprobeStatic
  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath)
  }
}

interface ProcessRequest {
  stagingId: string
  stagingUrl: string
  title: string
  artist?: string
  album?: string
  producer?: string
  year?: string
  tags?: string
  jingleId?: string
  position?: "start" | "middle" | "end" | "start-end"
  volume?: number // 0-100, will be converted to 0.0-1.0
  coverArtSource?: "original" | "default" | "custom"
  coverArtFile?: any
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ProcessRequest = await request.json()
    const {
      stagingId,
      stagingUrl,
      title,
      artist,
      album,
      producer,
      year,
      tags,
      jingleId,
      position,
      volume = 100,
      coverArtSource,
      coverArtFile,
    } = body

    if (!stagingId || !stagingUrl || !title) {
      return NextResponse.json(
        { error: "stagingId, stagingUrl, and title are required" },
        { status: 400 }
      )
    }

    // Get or create user
    let user = await db.users.findById(session.user.id)
    if (!user) {
      try {
        user = await db.users.create(
          {
            email: session.user.email || "",
            name: session.user.name || undefined,
            plan: "free",
            bandwidthLimit: 100 * 1024 * 1024,
          },
          session.user.id
        )
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

    if (!limits.canUpload) {
      return NextResponse.json(
        { error: limits.reason || "Upload limit reached" },
        { status: 403 }
      )
    }

    // Get staging file path
    const stagingFilename = path.basename(stagingUrl.replace("/api/temp/", ""))
    const stagingPath = path.join(process.cwd(), "tmp", "gispal", stagingFilename)

    // Check if staging file exists
    try {
      await fsPromises.access(stagingPath)
    } catch {
      return NextResponse.json(
        { error: "Staging file not found" },
        { status: 404 }
      )
    }

    // Get audio duration
    let duration: number | null = null
    try {
      const durationSeconds = await getAudioDuration(stagingPath)
      duration = Math.round(durationSeconds)
    } catch (error) {
      console.error("Failed to extract duration:", error)
    }

    // Prepare jingle config if jingle is selected
    let jingleConfigs: Array<{ path: string; position: "start" | "middle" | "end"; volume: number }> = []
    let jinglePath: string | null = null
    if (jingleId && position) {
      const jingle = await db.jingles.findById(jingleId)
      if (!jingle || jingle.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Jingle not found" },
          { status: 404 }
        )
      }

      // Get jingle file path (sanitize and use absolute paths)
      if (jingle.fileUrl.startsWith("/")) {
        const possiblePaths = [
          path.join(process.cwd(), "uploads", path.basename(jingle.fileUrl)),
          path.join(process.cwd(), jingle.fileUrl.replace("/api/storage/", "storage/").replace("/storage/", "storage/")),
        ]
        
        let found = false
        for (const possiblePath of possiblePaths) {
          try {
            await fsPromises.access(possiblePath)
            jinglePath = path.resolve(possiblePath) // Ensure absolute
            found = true
            break
          } catch {
            // Try next path
          }
        }
        
        if (!found) {
          // Fetch from URL
          const jingleUrl = jingle.fileUrl.startsWith("http") 
            ? jingle.fileUrl 
            : `http://localhost:3000${jingle.fileUrl}`
          const jingleResponse = await fetch(jingleUrl)
          if (jingleResponse.ok) {
            const jingleBuffer = await jingleResponse.arrayBuffer()
            const tempJingleDir = path.join(process.cwd(), "tmp", "gispal")
            if (!fs.existsSync(tempJingleDir)) {
              console.log("[FS] Creating directory:", tempJingleDir)
              fs.mkdirSync(tempJingleDir, { recursive: true })
            } else {
              console.log("[FS] Directory exists:", tempJingleDir)
            }
            const tempJinglePath = path.join(tempJingleDir, `temp_jingle_${Date.now()}.mp3`)
            await writeFile(tempJinglePath, Buffer.from(jingleBuffer))
            jinglePath = path.resolve(tempJinglePath) // Ensure absolute
          } else {
            return NextResponse.json(
              { error: "Could not access jingle file" },
              { status: 404 }
            )
          }
        }
      } else {
        // Remote URL - fetch it
        const jingleResponse = await fetch(jingle.fileUrl)
        if (!jingleResponse.ok) {
          return NextResponse.json(
            { error: "Could not fetch jingle from URL" },
            { status: 404 }
          )
        }
        const jingleBuffer = await jingleResponse.arrayBuffer()
        const tempJingleDir = path.join(process.cwd(), "tmp", "gispal")
        if (!fs.existsSync(tempJingleDir)) {
          console.log("[FS] Creating directory:", tempJingleDir)
          fs.mkdirSync(tempJingleDir, { recursive: true })
        } else {
          console.log("[FS] Directory exists:", tempJingleDir)
        }
        const tempJinglePath = path.join(tempJingleDir, `temp_jingle_${Date.now()}.mp3`)
        await writeFile(tempJinglePath, Buffer.from(jingleBuffer))
        jinglePath = path.resolve(tempJinglePath) // Ensure absolute
      }

      // Validate jinglePath is set before using it
      if (!jinglePath) {
        return NextResponse.json(
          { error: "Failed to resolve jingle file path" },
          { status: 500 }
        )
      }

      // Convert volume from 0-100 to 0.0-1.0
      const volumeNormalized = volume / 100

      // Handle start-end position
      if (position === "start-end") {
        jingleConfigs.push({
          path: jinglePath,
          position: "start",
          volume: volumeNormalized,
        })
        jingleConfigs.push({
          path: jinglePath,
          position: "end",
          volume: volumeNormalized,
        })
      } else {
        jingleConfigs.push({
          path: jinglePath,
          position: position as "start" | "middle" | "end",
          volume: volumeNormalized,
        })
      }
    }

    // Prepare cover art (will be used in STEP 2 after mixing)
    // Note: Cover art is applied AFTER mixing, not during
    let coverArtPath: string | undefined
    if (coverArtSource === "custom" && coverArtFile) {
      // Handle uploaded cover art file
      // For now, we'll need to handle this via form data in a separate request
      // This is a limitation - we'll need to upload cover art separately first
      // For MVP, we'll skip custom upload and use original/default
      console.log("[PROCESS] Custom cover art upload not yet implemented, will use default")
    } else if (coverArtSource === "original") {
      // Extract cover art from staging file
      try {
        const extractedCoverPath = await extractCoverArt(stagingPath)
        if (extractedCoverPath) {
          coverArtPath = extractedCoverPath
          console.log("[PROCESS] Extracted cover art from staging file:", coverArtPath)
        }
      } catch (error) {
        console.error("[PROCESS] Failed to extract cover art:", error)
      }
    } else if (coverArtSource === "default") {
      // Get default cover art
      const userCoverArts = await db.coverArts.findByUserId(session.user.id)
      const defaultArt = userCoverArts.find(art => art.isDefault)
      if (defaultArt) {
        // Download default cover art to temp
        const coverResponse = await fetch(defaultArt.fileUrl.startsWith("http") 
          ? defaultArt.fileUrl 
          : `http://localhost:3000${defaultArt.fileUrl}`)
        if (coverResponse.ok) {
          const coverBuffer = await coverResponse.arrayBuffer()
          const coverFilename = `cover_default_${Date.now()}.jpg`
          coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
          console.log("[PROCESS] Default cover art downloaded to:", coverArtPath)
        }
      }
    }
    // If coverArtSource is not set or cover art not found, it will be handled in STEP 2

    // Mix audio with jingles and apply metadata/cover art
    // CRITICAL: Use UUID-based filename - NEVER use user-provided titles
    const outputFilename = `final-${randomUUID()}.mp3`
    const uploadsDir = path.join(process.cwd(), "uploads")
    
    // Ensure uploads directory exists (synchronous check)
    if (!fs.existsSync(uploadsDir)) {
      console.log("[FS] Creating directory:", uploadsDir)
      fs.mkdirSync(uploadsDir, { recursive: true })
    } else {
      console.log("[FS] Directory exists:", uploadsDir)
    }
    
    // Build absolute output path - ALWAYS UUID-based, NEVER from metadata
    const absoluteOutputPath = path.join(process.cwd(), "uploads", outputFilename)
    
    // Validate output path
    if (!absoluteOutputPath.endsWith(".mp3")) {
      throw new Error(`Invalid output path: ${absoluteOutputPath} (must end with .mp3)`)
    }
    
    // CRITICAL DEBUG: Log final output path before any FFmpeg operations
    console.log("[DEBUG] ========== FINAL OUTPUT PATH ==========")
    console.log("[DEBUG] FINAL OUTPUT PATH:", absoluteOutputPath)
    console.log("[DEBUG] Output filename (UUID-based):", outputFilename)
    console.log("[DEBUG] =======================================")
    
    console.log("[PROCESS] ========== PROCESSING AUDIO ==========")
    console.log("[PROCESS] INPUT AUDIO:", stagingPath)
    console.log("[PROCESS] OUTPUT FILE:", absoluteOutputPath)
    console.log("[PROCESS] Output filename:", outputFilename)

    // STEP 1: Mix audio with jingles FIRST (without metadata)
    let mixedAudioPath: string
    if (jingleConfigs.length > 0) {
      // Create temporary path for mixed audio (before metadata injection)
      const tempMixedFilename = `temp_mixed_${randomUUID()}.mp3`
      const tempMixedPath = path.join(process.cwd(), "tmp", "gispal", tempMixedFilename)
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempMixedPath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      console.log("[PROCESS] Step 1: Mixing audio with jingles...")
      console.log("[PROCESS] Temp mixed path:", tempMixedPath)
      
      // Mix WITHOUT metadata or cover art - just pure mixing
      mixedAudioPath = await mixAudio({
        audioUrl: stagingPath,
        jingles: jingleConfigs,
        coverArtPath: undefined, // No cover art during mixing
        previewOnly: false,
        outputPath: tempMixedPath, // Use temp path
        metadata: undefined, // NO metadata during mixing
      })

      // Validate mixed file exists
      if (!fs.existsSync(mixedAudioPath)) {
        throw new Error(`Mixed audio file missing: ${mixedAudioPath}`)
      }
      console.log("[PROCESS] Step 1 complete: Mixed audio saved to:", mixedAudioPath)
    } else {
      // No jingles - use staging file as input for metadata injection
      mixedAudioPath = stagingPath
      console.log("[PROCESS] No jingles - using staging file for metadata injection")
    }

    // STEP 2: Apply metadata and cover art AFTER mixing
    console.log("[PROCESS] Step 2: Applying metadata and cover art...")
    
    // Ensure we have a cover art path (use default if none provided)
    let finalCoverArtPath = coverArtPath
    if (!finalCoverArtPath) {
      // Get default cover art
      const userCoverArts = await db.coverArts.findByUserId(session.user.id)
      const defaultArt = userCoverArts.find(art => art.isDefault)
      if (defaultArt) {
        console.log("[PROCESS] Using default cover art:", defaultArt.fileUrl)
        // Download default cover art to temp
        const coverResponse = await fetch(defaultArt.fileUrl.startsWith("http") 
          ? defaultArt.fileUrl 
          : `http://localhost:3000${defaultArt.fileUrl}`)
        if (coverResponse.ok) {
          const coverBuffer = await coverResponse.arrayBuffer()
          const coverFilename = `cover_default_${Date.now()}.jpg`
          finalCoverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
          console.log("[PROCESS] Default cover art downloaded to:", finalCoverArtPath)
        }
      }
    }
    
    // Apply metadata and cover art to the mixed audio
    const finalAudioPath = await processAudioMetadata(
      mixedAudioPath, // Input: mixed audio (or staging if no jingles)
      absoluteOutputPath, // Output: final UUID-based path
      {
        title,
        artist: artist || undefined,
        album: album || undefined,
        producer: producer || undefined,
        year: year || undefined,
        tags: tags || undefined,
      },
      finalCoverArtPath // Cover art (original, default, or custom)
    )
    
    // Clean up temp mixed file if it exists
    if (jingleConfigs.length > 0 && mixedAudioPath !== stagingPath && fs.existsSync(mixedAudioPath)) {
      try {
        await fsPromises.unlink(mixedAudioPath)
        console.log("[PROCESS] Cleaned up temp mixed file")
      } catch (error) {
        console.warn("[PROCESS] Failed to clean up temp file:", error)
      }
    }
    
    // Validate final output file exists
    if (!fs.existsSync(absoluteOutputPath)) {
      throw new Error(`Final output file missing: ${absoluteOutputPath}`)
    }
    console.log("[PROCESS] Step 2 complete: Final audio with metadata saved to:", absoluteOutputPath)

    // Get final duration
    let finalDuration = duration
    try {
      const finalDurationSeconds = await getAudioDuration(absoluteOutputPath)
      finalDuration = Math.round(finalDurationSeconds)
    } catch (error) {
      console.error("Failed to get final duration:", error)
    }

    // Save to database
    const audio = await db.audios.create({
      title,
      artist: artist || undefined,
      album: album || undefined,
      producer: producer || undefined,
      year: year || undefined,
      tags: tags || null,
      url: `/uploads/${outputFilename}`,
      duration: finalDuration,
    })

    // Record usage
    const fileSize = (await fsPromises.stat(absoluteOutputPath)).size
    await db.usage.record(session.user.id, "upload", {
      audioId: audio.id,
      duration: finalDuration,
      fileSize,
    })

    // Clean up staging file
    await fsPromises.unlink(stagingPath).catch(() => {})

    // Clean up temp jingle files
    for (const jingleConfig of jingleConfigs) {
      if (jingleConfig.path.includes("temp_jingle_")) {
        await fsPromises.unlink(jingleConfig.path).catch(() => {})
      }
    }

    return NextResponse.json({
      success: true,
      audio: {
        id: audio.id,
        title: audio.title,
        url: audio.url,
        duration: audio.duration,
        artist: audio.artist,
        album: audio.album,
        producer: audio.producer,
        year: audio.year,
        tags: audio.tags,
      },
    })
  } catch (error: any) {
    console.error("Process error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process audio" },
      { status: 500 }
    )
  }
}

// Helper function to process audio metadata and cover art AFTER mixing
// This function follows the exact FFmpeg structure: ffmpeg -i <mixedFile> -i <coverImage> -map 0:a -map 1:v -c:a copy -c:v copy -metadata ... <finalOutput>
async function processAudioMetadata(
  inputPath: string,
  outputPath: string,
  metadata: {
    title?: string
    artist?: string
    album?: string
    producer?: string
    year?: string
    tags?: string
  },
  coverArtPath?: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // Ensure output directory exists (synchronous)
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      console.log("[FS] Creating directory:", outputDir)
      fs.mkdirSync(outputDir, { recursive: true })
    } else {
      console.log("[FS] Directory exists:", outputDir)
    }

    // Resolve to absolute paths
    const absoluteInputPath = path.resolve(inputPath)
    const absoluteOutputPath = path.resolve(outputPath)
    
    // Debug logs
    console.log("[DEBUG][METADATA] Applying:", JSON.stringify(metadata, null, 2))
    console.log("[DEBUG][COVER ART] Using:", coverArtPath || "none")
    console.log("[PROCESS] Input file:", absoluteInputPath)
    console.log("[PROCESS] Output file:", absoluteOutputPath)
    
    // Initialize FFmpeg paths
    initializeFfmpegPaths()

    // Build FFmpeg command following exact structure:
    // ffmpeg -i <mixedFile> -i <coverImage> -map 0:a -map 1:v -c:a copy -c:v copy -metadata ... <finalOutput>
    let command = ffmpeg(absoluteInputPath)
    
    // Build output options array for debugging
    const outputOptions: string[] = []

    // Add cover art as second input if provided
    if (coverArtPath) {
      const absoluteCoverPath = path.resolve(coverArtPath)
      if (!fs.existsSync(absoluteCoverPath)) {
        reject(new Error(`Cover art file not found: ${absoluteCoverPath}`))
        return
      }
      command = command.input(absoluteCoverPath)
      console.log("[DEBUG][COVER ART] Absolute path:", absoluteCoverPath)
      
      // Map audio from first input and video (cover art) from second input
      outputOptions.push("-map", "0:a")
      outputOptions.push("-map", "1:v") // Use 1:v, NOT just 1
      outputOptions.push("-c:a", "copy") // Copy audio, don't re-encode
      outputOptions.push("-c:v", "copy") // Copy video/cover art
    } else {
      // No cover art - just map audio
      outputOptions.push("-map", "0:a")
      outputOptions.push("-c:a", "copy") // Copy audio, don't re-encode
    }

    // Add ID3v2.3 tags (most compatible)
    outputOptions.push("-id3v2_version", "3")
    outputOptions.push("-write_id3v1", "1")

    // Add metadata - use quotes to preserve spaces in values
    // DO NOT sanitize spaces - we want to preserve the original metadata
    // FFmpeg will handle quotes correctly
    if (metadata.title) {
      outputOptions.push("-metadata", `title=${metadata.title}`)
    }
    if (metadata.artist) {
      outputOptions.push("-metadata", `artist=${metadata.artist}`)
    }
    if (metadata.album) {
      outputOptions.push("-metadata", `album=${metadata.album}`)
    }
    if (metadata.producer) {
      outputOptions.push("-metadata", `TXXX=PRODUCER:${metadata.producer}`)
    }
    if (metadata.year) {
      outputOptions.push("-metadata", `date=${metadata.year}`)
    }
    if (metadata.tags) {
      // For tags/genre, join with comma
      const genreValue = metadata.tags.split(",").map(t => t.trim()).join(", ")
      outputOptions.push("-metadata", `genre=${genreValue}`)
    }

    // Add overwrite flag
    outputOptions.push("-y")
    
    // Log the command arguments
    console.log("[DEBUG][FFMPEG CMD] args:", outputOptions)
    
    // Apply all output options
    command = command.outputOptions(outputOptions)
    
    // Set output path LAST
    command = command.output(absoluteOutputPath)
    
    // Final validation: Ensure output path is UUID-based
    const outputBasename = path.basename(absoluteOutputPath)
    if (!outputBasename.startsWith("final-") && !outputBasename.startsWith("mixed-")) {
      reject(new Error(`Output filename must be UUID-based, got: ${outputBasename}`))
      return
    }
    
    // Verify the output path is valid before running
    if (!absoluteOutputPath || !absoluteOutputPath.endsWith(".mp3")) {
      reject(new Error(`Invalid output path: ${absoluteOutputPath}`))
      return
    }
    
    // Add event handlers
    command
      .on("start", (commandLine) => {
        console.log("[PROCESS] ========== FFMPEG METADATA INJECTION ==========")
        console.log("[PROCESS] Full command:", commandLine)
        console.log("[PROCESS] Input file:", absoluteInputPath)
        console.log("[PROCESS] Output file:", absoluteOutputPath)
        console.log("[PROCESS] Cover art:", coverArtPath || "none")
        console.log("[PROCESS] ===============================================")
      })
      .on("end", () => {
        // Validate output file exists
        if (!fs.existsSync(absoluteOutputPath)) {
          reject(new Error(`Output file missing after FFmpeg processing: ${absoluteOutputPath}`))
          return
        }
        
        // Validate file is not empty
        const stats = fs.statSync(absoluteOutputPath)
        if (stats.size === 0) {
          reject(new Error(`Output file is empty: ${absoluteOutputPath}`))
          return
        }
        
        console.log("[PROCESS] Metadata injection completed successfully")
        console.log("[PROCESS] Output file:", absoluteOutputPath)
        console.log("[PROCESS] Output file size:", stats.size, "bytes")
        console.log("[PROCESS] To verify metadata, run: ffprobe", absoluteOutputPath)
        
        resolve(absoluteOutputPath)
      })
      .on("error", (err) => {
        console.error("[PROCESS] FFmpeg error:", err.message)
        console.error("[PROCESS] Output path was:", absoluteOutputPath)
        console.error("[PROCESS] Output filename:", path.basename(absoluteOutputPath))
        console.error("[PROCESS] Full error:", err)
        reject(err)
      })
      .run()
  })
}

