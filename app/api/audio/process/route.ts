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
import { spawn } from "child_process"
import NodeID3 from "node-id3"

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
    
    // Clean up temp files
    const tempFilesToClean: string[] = []
    
    // Clean up temp mixed file if it exists
    if (jingleConfigs.length > 0 && mixedAudioPath !== stagingPath && fs.existsSync(mixedAudioPath)) {
      tempFilesToClean.push(mixedAudioPath)
    }
    
    // Clean up temp cover art file if it was downloaded
    if (finalCoverArtPath && finalCoverArtPath !== coverArtPath && finalCoverArtPath.includes("cover_default_")) {
      tempFilesToClean.push(finalCoverArtPath)
    }
    
    // Clean up all temp files
    for (const tempFile of tempFilesToClean) {
      try {
        if (fs.existsSync(tempFile)) {
          await fsPromises.unlink(tempFile)
          console.log("[PROCESS] Cleaned up temp file:", path.basename(tempFile))
        }
      } catch (error) {
        console.warn("[PROCESS] Failed to clean up temp file:", tempFile, error)
      }
    }
    
    // Validate final output file exists
    if (!fs.existsSync(absoluteOutputPath)) {
      throw new Error(`Final output file missing: ${absoluteOutputPath}`)
    }
    
    const finalStats = fs.statSync(absoluteOutputPath)
    if (finalStats.size === 0) {
      throw new Error(`Final output file is empty: ${absoluteOutputPath}`)
    }
    
    console.log("[PROCESS] Step 2 complete: Final audio with metadata saved to:", absoluteOutputPath)
    console.log("[PROCESS] Final file size:", finalStats.size, "bytes")

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
// Uses node-id3 library instead of FFmpeg for reliable metadata injection
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
  try {
    // Ensure output directory exists (synchronous)
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      console.log("[FS] Creating directory:", outputDir)
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Resolve to absolute paths
    const absoluteInputPath = path.resolve(inputPath)
    const absoluteOutputPath = path.resolve(outputPath)
    
    // Validate input file exists
    if (!fs.existsSync(absoluteInputPath)) {
      throw new Error(`Input file not found: ${absoluteInputPath}`)
    }
    
    // Validate output path ends with .mp3
    if (!absoluteOutputPath.endsWith(".mp3")) {
      throw new Error(`Output path must end with .mp3: ${absoluteOutputPath}`)
    }
    
    // Log metadata and cover art
    console.log("[METADATA] ========== METADATA INJECTION ==========")
    console.log("[METADATA] Applying:", JSON.stringify(metadata, null, 2))
    console.log("[COVER] Using:", coverArtPath || "none")
    console.log("[METADATA] Input file:", absoluteInputPath)
    console.log("[METADATA] Output file:", absoluteOutputPath)
    
    // Read the input MP3 file as Buffer
    const audioBuffer = await fsPromises.readFile(absoluteInputPath)
    const originalSize = audioBuffer.length
    console.log("[METADATA] Read input file, size:", originalSize, "bytes")
    
    // Prepare cover art image buffer if provided
    let coverImageBuffer: Buffer | undefined
    let coverMimeType: string = "image/jpeg"
    
    if (coverArtPath) {
      const absoluteCoverPath = path.resolve(coverArtPath)
      if (!fs.existsSync(absoluteCoverPath)) {
        console.warn(`[METADATA] Cover art file not found: ${absoluteCoverPath}, continuing without cover art`)
      } else {
        // Validate cover art is PNG or JPG
        const coverExt = path.extname(absoluteCoverPath).toLowerCase()
        if (![".png", ".jpg", ".jpeg"].includes(coverExt)) {
          console.warn(`[METADATA] Cover art extension ${coverExt} may not be supported, continuing anyway`)
        }
        
        // Detect mime type from extension
        coverMimeType = coverExt === ".png" ? "image/png" : "image/jpeg"
        
        // Read cover art as Buffer
        coverImageBuffer = await fsPromises.readFile(absoluteCoverPath)
        console.log("[METADATA] Read cover art, size:", coverImageBuffer.length, "bytes")
        console.log("[METADATA] Cover art mime type:", coverMimeType)
        
        // Validate cover art buffer
        if (!coverImageBuffer || coverImageBuffer.length === 0) {
          console.warn("[METADATA] Cover art buffer is empty, continuing without cover art")
          coverImageBuffer = undefined
        }
      }
    }
    
    // If no cover art provided, skip embedding
    if (!coverImageBuffer) {
      console.log("[METADATA] No cover art provided, skipping APIC frame embedding")
    }
    
    // Build ID3 tags using node-id3
    const tags: NodeID3.Tags = {}
    
    // Title
    if (metadata.title) {
      tags.title = metadata.title
      console.log("[METADATA] Title:", metadata.title)
    }
    
    // Artist
    if (metadata.artist) {
      tags.artist = metadata.artist
      console.log("[METADATA] Artist:", metadata.artist)
    }
    
    // Album
    if (metadata.album) {
      tags.album = metadata.album
      console.log("[METADATA] Album:", metadata.album)
    }
    
    // Year
    if (metadata.year) {
      tags.year = metadata.year
      console.log("[METADATA] Year:", metadata.year)
    }
    
    // Genre (from tags field - now a single genre selection)
    if (metadata.tags) {
      tags.genre = metadata.tags
      console.log("[METADATA] Genre:", metadata.tags)
    }
    
    // Producer (as TXXX frame)
    if (metadata.producer) {
      tags.userDefinedText = [
        {
          description: "PRODUCER",
          value: metadata.producer,
        },
      ]
      console.log("[METADATA] Producer:", metadata.producer)
    }
    
    // Cover art (APIC frame) - CRITICAL: Use correct APIC format
    if (coverImageBuffer && coverImageBuffer.length > 0) {
      // Use APIC key with proper structure (not "image")
      tags.APIC = {
        mime: coverMimeType,
        type: 3, // Front cover (ID3v2.3 standard)
        description: "Cover",
        imageBuffer: coverImageBuffer,
      }
      console.log("[METADATA] APIC frame prepared:")
      console.log("[METADATA]   - Mime type:", coverMimeType)
      console.log("[METADATA]   - Type: 3 (Front cover)")
      console.log("[METADATA]   - Buffer size:", coverImageBuffer.length, "bytes")
    } else {
      console.log("[METADATA] No cover art provided, skipping APIC frame")
    }
    
    // Remove existing APIC frames first (to avoid duplicates)
    console.log("[METADATA] Removing existing APIC frames...")
    const bufferWithoutAPIC = NodeID3.update({ APIC: undefined }, audioBuffer)
    const cleanedBuffer = bufferWithoutAPIC || audioBuffer
    
    // Update tags in the buffer using NodeID3.update() (not write)
    console.log("[METADATA] Updating tags in audio buffer...")
    const updatedBuffer = NodeID3.update(tags, cleanedBuffer)
    
    if (!updatedBuffer) {
      throw new Error("Failed to update ID3 tags in audio buffer")
    }
    
    const updatedSize = updatedBuffer.length
    console.log("[METADATA] Tags updated:")
    console.log("[METADATA]   - Original size:", originalSize, "bytes")
    console.log("[METADATA]   - Updated size:", updatedSize, "bytes")
    console.log("[METADATA]   - Size change:", updatedSize - originalSize, "bytes")
    
    // Write the updated buffer to output file
    await fsPromises.writeFile(absoluteOutputPath, updatedBuffer)
    console.log("[METADATA] Output file written:", absoluteOutputPath)
    
    // Validate output file exists and is not empty
    if (!fs.existsSync(absoluteOutputPath)) {
      throw new Error(`Output file missing after writing: ${absoluteOutputPath}`)
    }
    
    const stats = fs.statSync(absoluteOutputPath)
    if (stats.size === 0) {
      throw new Error(`Output file is empty: ${absoluteOutputPath}`)
    }
    
    console.log("[METADATA] Final MP3 size:", stats.size, "bytes")
    console.log("[METADATA] Injection completed successfully")
    
    // Verify metadata was written (read back)
    try {
      const readTags = NodeID3.read(updatedBuffer)
      console.log("[METADATA] Verification - Read back tags:")
      console.log("[METADATA]   - Title:", readTags.title || "none")
      console.log("[METADATA]   - Artist:", readTags.artist || "none")
      console.log("[METADATA]   - Album:", readTags.album || "none")
      console.log("[METADATA]   - Year:", readTags.year || "none")
      console.log("[METADATA]   - Genre:", readTags.genre || "none")
      console.log("[METADATA]   - Has APIC:", !!readTags.APIC)
      if (readTags.APIC) {
        console.log("[METADATA]   - APIC mime:", readTags.APIC.mime)
        console.log("[METADATA]   - APIC type:", readTags.APIC.type)
        console.log("[METADATA]   - APIC buffer size:", readTags.APIC.imageBuffer?.length || 0, "bytes")
      }
    } catch (error) {
      console.warn("[METADATA] Could not verify tags:", error)
    }
    
    console.log("[METADATA] ======================================")
    
    return absoluteOutputPath
  } catch (error: any) {
    console.error("[METADATA] Error processing metadata:", error)
    throw new Error(`Failed to process metadata: ${error.message}`)
  }
}

