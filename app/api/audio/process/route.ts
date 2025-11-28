import { NextRequest, NextResponse } from "next/server"
import { auth, getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration, mixAudio, extractCoverArt, initializeFfmpegPaths } from "@/lib/ffmpeg"
import { tempStorage } from "@/lib/storage"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import ffprobeStatic from "ffprobe-static"
import fs from "fs"
import { promises as fsPromises } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { writeFile } from "fs/promises"
import NodeID3 from "node-id3"

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication - use getSession helper
    console.log("[PROCESS] Checking authentication...")
    const session = await getSession(request)
    console.log("[PROCESS] Session result:", session ? "Found" : "Not found")
    
    // Allow access in development mode (localhost) even without session
    const isDevelopment = process.env.NODE_ENV === "development" || 
                          request.headers.get("host")?.includes("localhost")
    
    if (!session || !session.user) {
      if (isDevelopment) {
        console.log("[PROCESS] Development mode - allowing access without session")
        // For development, we'll still need a user ID, so create a temporary one
        // But first, let's check if we can proceed
      } else {
        console.error("[PROCESS] Unauthorized: No session or user")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    
    // If we have a session, validate it
    if (session && (!session.user || !session.user.id)) {
      if (!isDevelopment) {
        console.error("[PROCESS] Unauthorized: No user ID in session")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    
    if (session?.user?.id) {
      console.log("[PROCESS] Authenticated user ID:", session.user.id)
    } else if (isDevelopment) {
      console.log("[PROCESS] Development mode - proceeding without user ID")
    }

    // Get or create user in our database (only if we have a session)
    let user = null
    if (session?.user?.id) {
      user = await db.users.findById(session.user.id)
      if (!user) {
        console.log("[PROCESS] User not found in DB, creating...")
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
            console.log("[PROCESS] First user set as admin")
          }
        } catch (error: any) {
          console.error("[PROCESS] Error creating user:", error)
          return NextResponse.json(
            { error: "Failed to initialize user account" },
            { status: 500 }
          )
        }
      }
      
      // Grant admin access for testing (if not already admin)
      if (user.role !== "admin") {
        console.log("[PROCESS] Elevating user to admin for testing")
        user = await db.users.update(user.id, { role: "admin" })
      }
    } else if (isDevelopment) {
      // In development mode without session, we'll proceed but skip user-specific operations
      console.log("[PROCESS] Development mode - skipping user operations")
    }

    const body = await request.json()
    const {
      stagingId,
      title,
      artist,
      album,
      producer,
      year,
      tags,
      jingleId,
      position,
      volume,
      coverArt, // New: direct path to cover art /storage/cover-art/{userId}/{uuid}.jpg
      coverArtSource, // Legacy support
      coverArtFile, // Legacy support
    } = body

    if (!stagingId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get staging file - staging files are stored in tmp/gispal with pattern staged_{stagingId}.mp3
    // Try to get from database first, if not found, reconstruct path
    let staging = await db.staging.findById(stagingId)
    
    let stagingPath: string
    if (staging) {
      // Staging entry exists in database
      if (session?.user?.id && staging.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      stagingPath = staging.filePath
    } else {
      // Staging entry not in database, reconstruct path from stagingId
      // This handles cases where staging was created before db.staging was implemented
      const filename = `staged_${stagingId}.mp3`
      stagingPath = path.join(process.cwd(), "tmp", "gispal", filename)
      console.log("[PROCESS] Staging entry not in DB, reconstructing path:", stagingPath)
    }

    if (!fs.existsSync(stagingPath)) {
      return NextResponse.json({ error: "Staging file missing" }, { status: 404 })
    }

    // Get duration from staging (if available) or extract from file
    let duration = staging?.duration || 0
    try {
      const durationSeconds = await getAudioDuration(stagingPath)
      duration = Math.round(durationSeconds)
      console.log("[PROCESS] Extracted duration:", duration, "seconds")
    } catch (error) {
      console.error("[PROCESS] Failed to get staging duration:", error)
      // Continue with duration = 0 if extraction fails
      duration = 0
    }

    // Prepare jingle configs
    const jingleConfigs: Array<{
      path: string
      position: "start" | "middle" | "end" | "start-end"
      volume: number
    }> = []

    if (jingleId) {
      const jingle = await db.jingles.findById(jingleId)
      if (!jingle || (session?.user?.id && jingle.userId !== session.user.id)) {
        return NextResponse.json({ error: "Jingle not found" }, { status: 404 })
      }

      // Jingle interface has 'fileUrl' not 'filePath'
      if (!jingle.fileUrl) {
        return NextResponse.json({ error: "Jingle file URL is missing" }, { status: 400 })
      }

      // Convert fileUrl to absolute path
      // fileUrl can be like "/storage/jingles/..." or "/api/storage/jingles/..."
      let jinglePath: string
      if (jingle.fileUrl.startsWith("/uploads/") || jingle.fileUrl.startsWith("/storage/")) {
        jinglePath = path.join(process.cwd(), jingle.fileUrl.replace(/^\/api\/storage\//, "storage/").replace(/^\/storage\//, "storage/"))
      } else if (jingle.fileUrl.startsWith("/api/storage/")) {
        jinglePath = path.join(process.cwd(), jingle.fileUrl.replace("/api/storage/", "storage/"))
      } else if (jingle.fileUrl.startsWith("http")) {
        // If it's a full URL, we need to download it first
        console.log("[PROCESS] Jingle is a remote URL, downloading...")
        const jingleResponse = await fetch(jingle.fileUrl)
        if (!jingleResponse.ok) {
          return NextResponse.json({ error: "Failed to download jingle" }, { status: 500 })
        }
        const jingleBuffer = await jingleResponse.arrayBuffer()
        const jingleFilename = `jingle_${jingleId}_${Date.now()}.mp3`
        jinglePath = await tempStorage.save(Buffer.from(jingleBuffer), jingleFilename)
        console.log("[PROCESS] Jingle downloaded to:", jinglePath)
      } else {
        // Assume it's a relative path
        jinglePath = path.join(process.cwd(), jingle.fileUrl)
      }

      if (!fs.existsSync(jinglePath)) {
        console.error("[PROCESS] Jingle file not found at:", jinglePath)
        return NextResponse.json({ error: `Jingle file missing: ${jinglePath}` }, { status: 404 })
      }
      
      console.log("[PROCESS] Using jingle from:", jinglePath)

      // Handle start-end position (overlay twice)
      if (position === "start-end") {
        jingleConfigs.push({
          path: jinglePath,
          position: "start",
          volume: volume !== undefined ? volume / 100 : 1.0,
        })
        jingleConfigs.push({
          path: jinglePath,
          position: "end",
          volume: volume !== undefined ? volume / 100 : 1.0,
        })
      } else {
        jingleConfigs.push({
          path: jinglePath,
          position: (position as "start" | "middle" | "end") || "start",
          volume: volume !== undefined ? volume / 100 : 1.0,
        })
      }
    }

    // Handle cover art - NEW SYSTEM: use coverArt path directly
    let coverArtPath: string | undefined
    
    if (coverArt && typeof coverArt === "string" && coverArt.startsWith("/storage/cover-art/")) {
      // New system: direct path provided
      coverArtPath = path.join(process.cwd(), coverArt)
      console.log("[PROCESS] Using cover art from new system:", coverArtPath)
      
      if (!fs.existsSync(coverArtPath)) {
        console.error("[PROCESS] Cover art file not found:", coverArtPath)
        coverArtPath = undefined
      }
    } else {
      // Legacy support: try to extract or use default
      console.log("[PROCESS] Legacy cover art handling - coverArtSource:", coverArtSource || "not specified")
      
      if (coverArtSource === "original") {
        try {
          const extractedCoverPath = await extractCoverArt(stagingPath)
          if (extractedCoverPath) {
            coverArtPath = extractedCoverPath
            console.log("[PROCESS] Extracted cover art from staging file:", coverArtPath)
          }
        } catch (error) {
          console.error("[PROCESS] Failed to extract cover art:", error)
        }
      }
    }

    // Mix audio with jingles and apply metadata/cover art
    // Generate UUID FIRST - this will be used for both filename AND audio ID
    // This ensures the GET route can reconstruct the filename from params.id
    const uuid = randomUUID()
    const outputFilename = `final-${uuid}.mp3`
    const uploadsDir = path.join(process.cwd(), "uploads")
    
    // Ensure /uploads directory exists at project root
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log("[PROCESS] Created uploads directory:", uploadsDir)
    }
    
    const absoluteOutputPath = path.join(process.cwd(), "uploads", outputFilename)
    
    if (!absoluteOutputPath.endsWith(".mp3")) {
      throw new Error(`Invalid output path: ${absoluteOutputPath} (must end with .mp3)`)
    }
    
    console.log("[PROCESS] ========== PROCESSING AUDIO ==========")
    console.log("[PROCESS] INPUT AUDIO:", stagingPath)
    console.log("[PROCESS] OUTPUT FILE:", absoluteOutputPath)

    // STEP 1: Mix audio with jingles FIRST (without metadata)
    let mixedAudioPath: string
    if (jingleConfigs.length > 0) {
      const tempMixedFilename = `temp_mixed_${randomUUID()}.mp3`
      const tempMixedPath = path.join(process.cwd(), "tmp", "gispal", tempMixedFilename)
      
      const tempDir = path.dirname(tempMixedPath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      console.log("[PROCESS] Step 1: Mixing audio with jingles...")
      console.log("[PROCESS] Temp mixed path:", tempMixedPath)
      
      mixedAudioPath = await mixAudio({
        audioUrl: stagingPath,
        jingles: jingleConfigs,
        coverArtPath: undefined,
        previewOnly: false,
        outputPath: tempMixedPath,
        metadata: undefined,
      })

      if (!fs.existsSync(mixedAudioPath)) {
        throw new Error(`Mixed audio file missing: ${mixedAudioPath}`)
      }
      console.log("[PROCESS] Step 1 complete: Mixed audio saved to:", mixedAudioPath)
    } else {
      mixedAudioPath = stagingPath
      console.log("[PROCESS] No jingles - using staging file for metadata injection")
    }

    // STEP 2: Apply metadata and cover art AFTER mixing
    console.log("[PROCESS] Step 2: Applying metadata and cover art...")
    
    // Use the cover art path we already resolved
    let finalCoverArtPath = coverArtPath
    
    // Log final cover art path and verify it exists
    if (finalCoverArtPath) {
      console.log("[PROCESS] ✅ Final cover art path resolved:", finalCoverArtPath)
      if (!fs.existsSync(finalCoverArtPath)) {
        console.error("[PROCESS] ❌ Cover art file does not exist:", finalCoverArtPath)
        finalCoverArtPath = undefined
      } else {
        const stats = fs.statSync(finalCoverArtPath)
        console.log("[PROCESS] Cover art file size:", stats.size, "bytes")
      }
    } else {
      console.log("[PROCESS] ⚠️ No cover art will be embedded")
    }
    
    // Convert coverArtPath to storage path format for database
    const coverArtStoragePath = finalCoverArtPath 
      ? finalCoverArtPath.replace(process.cwd(), "").replace(/\\/g, "/")
      : null
    
    const finalAudioPath = await processAudioMetadata(
      mixedAudioPath,
      absoluteOutputPath,
      {
        title,
        artist: artist || undefined,
        album: album || undefined,
        producer: producer || undefined,
        year: year || undefined,
        tags: tags || undefined,
      },
      finalCoverArtPath
    )
    
    // Clean up temp files
    console.log("[PROCESS] Cleaning up temp files...")
    const tempFilesToClean: string[] = []
    
    // Clean up temp mixed file if it exists
    if (jingleConfigs.length > 0 && mixedAudioPath && mixedAudioPath !== stagingPath && fs.existsSync(mixedAudioPath)) {
      tempFilesToClean.push(mixedAudioPath)
      console.log("[PROCESS] Will clean up temp mixed file:", mixedAudioPath ? path.basename(mixedAudioPath) : "unknown")
    }
    
    // Clean up temp cover art file if it was downloaded
    if (finalCoverArtPath && finalCoverArtPath !== coverArtPath && finalCoverArtPath.includes("cover_default_")) {
      tempFilesToClean.push(finalCoverArtPath)
      console.log("[PROCESS] Will clean up temp cover art:", finalCoverArtPath ? path.basename(finalCoverArtPath) : "unknown")
    }
    
    // Clean up all temp files
    for (const tempFile of tempFilesToClean) {
      try {
        if (tempFile && fs.existsSync(tempFile)) {
          await fsPromises.unlink(tempFile)
          console.log("[PROCESS] ✅ Cleaned up temp file:", tempFile ? path.basename(tempFile) : "unknown")
        }
      } catch (error) {
        console.warn("[PROCESS] ⚠️ Failed to clean up temp file:", tempFile, error)
      }
    }
    
    // Also clean up any other temp files in tmp/gispal that match our pattern
    try {
      const tmpDir = path.join(process.cwd(), "tmp", "gispal")
      if (fs.existsSync(tmpDir)) {
        const files = await fsPromises.readdir(tmpDir)
        for (const file of files) {
          if (file.startsWith("temp_mixed_") || file.startsWith("cover_default_")) {
            const filePath = path.join(tmpDir, file)
            try {
              await fsPromises.unlink(filePath)
              console.log("[PROCESS] ✅ Cleaned up orphaned temp file:", file)
            } catch (error) {
              // Ignore errors for orphaned files
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors in cleanup
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
    
    // CRITICAL: Verify final file has metadata (check for overwrite)
    console.log("[PROCESS] Step 2b: Verifying final file was not overwritten...")
    await debugReadTags(absoluteOutputPath)
    
    // Verify no overwrites happened after metadata injection
    const verifyStats = fs.statSync(absoluteOutputPath)
    if (verifyStats.size !== finalStats.size) {
      console.error("[PROCESS] ⚠️ WARNING: File size changed after metadata injection!")
      console.error("[PROCESS]   - Original size:", finalStats.size, "bytes")
      console.error("[PROCESS]   - Current size:", verifyStats.size, "bytes")
      console.error("[PROCESS]   - This indicates the file may have been overwritten!")
    } else {
      console.log("[PROCESS] ✅ File size unchanged - no overwrites detected")
    }

    // Get final duration
    let finalDuration = duration
    try {
      const finalDurationSeconds = await getAudioDuration(absoluteOutputPath)
      finalDuration = Math.round(finalDurationSeconds)
    } catch (error) {
      console.error("Failed to get final duration:", error)
    }

    // Save to database
    // CRITICAL: Use the same UUID for audio ID so GET route can reconstruct filename
    // Audio interface expects 'url' not 'fileUrl' or 'filePath'
    const audio = await db.audios.create({
      title,
      artist: artist || null,
      album: album || null,
      producer: producer || null,
      year: year || null,
      tags: tags || null,
      url: `/uploads/${outputFilename}`, // Use 'url' property as expected by Audio interface
      duration: finalDuration,
      coverArt: coverArtStoragePath, // Store cover art path
    }, uuid) // Pass UUID as second parameter to use as audio ID
    
    console.log("[PROCESS] Audio saved to database:")
    console.log("[PROCESS]   - ID:", audio.id)
    console.log("[PROCESS]   - Title:", audio.title)
    console.log("[PROCESS]   - URL:", audio.url)
    console.log("[PROCESS]   - Duration:", audio.duration)

    // Record usage (only if we have a session)
    if (session?.user?.id) {
      try {
        const fileSize = (await fsPromises.stat(absoluteOutputPath)).size
        await db.usage.record(session.user.id, "upload", {
          audioId: audio.id,
          duration: finalDuration,
          fileSize,
        })
      } catch (usageError) {
        console.error("Failed to record usage:", usageError)
      }
    }

    // Delete staging entry and file
    try {
      await db.staging.delete(stagingId)
      console.log("[PROCESS] Deleted staging entry from DB")
    } catch (error) {
      console.warn("[PROCESS] Failed to delete staging entry from DB:", error)
    }
    
    // Also try to delete the staging file
    try {
      if (stagingPath && fs.existsSync(stagingPath)) {
        await fsPromises.unlink(stagingPath)
        console.log("[PROCESS] Deleted staging file:", stagingPath ? path.basename(stagingPath) : "unknown")
      }
    } catch (error) {
      console.warn("[PROCESS] Failed to delete staging file:", error)
    }

    return NextResponse.json({
      success: true,
      audio: {
        id: audio.id,
        title: audio.title,
        artist: audio.artist,
        album: audio.album,
        url: audio.url, // Use 'url' property as expected by Audio interface
        duration: audio.duration,
      },
    })
  } catch (error: any) {
    console.error("[PROCESS] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process audio" },
      { status: 500 }
    )
  }
}

// DEBUG FUNCTION: Read and dump all ID3 tags from a file
async function debugReadTags(filePath: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath)
    console.log("[DEBUG] ========== READING TAGS FROM FILE ==========")
    console.log("[DEBUG] File path:", absolutePath)
    
    if (!fs.existsSync(absolutePath)) {
      console.error("[DEBUG] ❌ FILE DOES NOT EXIST:", absolutePath)
      return
    }
    
    const stats = fs.statSync(absolutePath)
    console.log("[DEBUG] File size:", stats.size, "bytes")
    
    const fileBuffer = await fsPromises.readFile(absolutePath)
    console.log("[DEBUG] Read file buffer, size:", fileBuffer.length, "bytes")
    
    const tags = NodeID3.read(fileBuffer)
    
    console.log("[DEBUG] ========== ID3 TAGS DUMP ==========")
    console.log("[DEBUG] Title:", tags.title || "MISSING")
    console.log("[DEBUG] Artist:", tags.artist || "MISSING")
    console.log("[DEBUG] Album:", tags.album || "MISSING")
    console.log("[DEBUG] Year:", tags.year || "MISSING")
    console.log("[DEBUG] Genre:", tags.genre || "MISSING")
    
    // Check for image/APIC frame
    console.log("[DEBUG] ========== IMAGE/APIC FRAME CHECK ==========")
    if (tags.image) {
      console.log("[DEBUG] ✅ IMAGE TAG EXISTS")
      
      if (typeof tags.image === "string") {
        console.log("[DEBUG] Image is a string (filename):", tags.image)
        console.log("[DEBUG] ⚠️ This is a filename reference, not embedded image!")
      } else if (typeof tags.image === "object" && tags.image !== null) {
        console.log("[DEBUG] Image is an object (embedded):")
        console.log("[DEBUG]   - Mime type:", tags.image.mime || "MISSING")
        console.log("[DEBUG]   - Type:", JSON.stringify(tags.image.type, null, 2))
        console.log("[DEBUG]   - Description:", tags.image.description || "MISSING")
        console.log("[DEBUG]   - Image buffer exists:", !!tags.image.imageBuffer)
        console.log("[DEBUG]   - Image buffer size:", tags.image.imageBuffer?.length || 0, "bytes")
        
        if (tags.image.imageBuffer && tags.image.imageBuffer.length > 0) {
          console.log("[DEBUG]   - Image buffer first 4 bytes:", tags.image.imageBuffer.slice(0, 4).toString("hex"))
          console.log("[DEBUG]   ✅ IMAGE BUFFER IS POPULATED")
        } else {
          console.error("[DEBUG]   ❌ IMAGE BUFFER IS EMPTY OR MISSING")
        }
      }
    } else {
      console.error("[DEBUG] ❌ APIC/IMAGE TAG MISSING IN FINAL FILE")
      console.error("[DEBUG] This means cover art was NOT embedded!")
    }
    
    // Dump all tags as JSON for inspection
    console.log("[DEBUG] ========== FULL TAGS OBJECT ==========")
    console.log("[DEBUG] Raw tags:", JSON.stringify({
      title: tags.title,
      artist: tags.artist,
      album: tags.album,
      year: tags.year,
      genre: tags.genre,
      hasImage: !!tags.image,
      imageType: typeof tags.image,
      imageValue: typeof tags.image === "string" ? tags.image : (typeof tags.image === "object" && tags.image !== null ? {
        mime: tags.image.mime,
        type: tags.image.type,
        description: tags.image.description,
        bufferSize: tags.image.imageBuffer?.length || 0
      } : null)
    }, null, 2))
    
    console.log("[DEBUG] ======================================")
  } catch (error: any) {
    console.error("[DEBUG] ❌ ERROR READING TAGS:", error.message)
    console.error("[DEBUG] Stack:", error.stack)
  }
}

// METADATA INJECTION FUNCTION - Uses NodeID3.write() as specified
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
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const absoluteInputPath = path.resolve(inputPath)
    const absoluteOutputPath = path.resolve(outputPath)
    
    if (!fs.existsSync(absoluteInputPath)) {
      throw new Error(`Input file not found: ${absoluteInputPath}`)
    }
    
    if (!absoluteOutputPath.endsWith(".mp3")) {
      throw new Error(`Output path must end with .mp3: ${absoluteOutputPath}`)
    }
    
    console.log("[TAG] ========== METADATA INJECTION ==========")
    console.log("[TAG] Input file:", absoluteInputPath)
    console.log("[TAG] Output file:", absoluteOutputPath)
    
    // Read input audio file
    const audioBuffer = await fsPromises.readFile(absoluteInputPath)
    console.log("[TAG] Input file size:", audioBuffer.length, "bytes")
    
    // Prepare cover art buffer
    let coverImageBuffer: Buffer | undefined
    
    if (coverArtPath) {
      const absoluteCoverPath = path.resolve(coverArtPath)
      console.log("[TAG] Loading cover art from:", absoluteCoverPath)
      
      if (!fs.existsSync(absoluteCoverPath)) {
        console.error("[TAG] ❌ Cover art file not found:", absoluteCoverPath)
      } else {
        coverImageBuffer = await fsPromises.readFile(absoluteCoverPath)
        console.log("[TAG] ✅ Loaded cover art:", coverImageBuffer.length, "bytes")
        
        // Validate it's a valid image
        const isJPEG = coverImageBuffer[0] === 0xFF && coverImageBuffer[1] === 0xD8 && coverImageBuffer[2] === 0xFF
        const isPNG = coverImageBuffer[0] === 0x89 && coverImageBuffer[1] === 0x50 && coverImageBuffer[2] === 0x4E && coverImageBuffer[3] === 0x47
        
        if (!isJPEG && !isPNG) {
          console.warn("[TAG] ⚠️ Cover art may not be valid JPEG/PNG")
        }
      }
    } else {
      console.log("[TAG] No cover art path provided")
    }
    
    // Build tags object as specified
    const finalTags: NodeID3.Tags = {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      year: metadata.year || new Date().getFullYear().toString(),
      genre: metadata.tags,
    }
    
    // Add producer if provided
    if (metadata.producer) {
      finalTags.userDefinedText = [{
        description: "PRODUCER",
        value: metadata.producer,
      }]
    }
    
    // Add cover art image as specified
    if (coverImageBuffer && coverImageBuffer.length > 0) {
      finalTags.image = {
        mime: "image/jpeg",
        type: {
          id: 3,
          name: "front cover"
        },
        description: "Cover",
        imageBuffer: coverImageBuffer,
      }
      
      console.log("[TAG] ✅ Cover art prepared for embedding")
      console.log("[TAG]   - Image buffer size:", coverImageBuffer.length, "bytes")
      console.log("[TAG]   - Mime type: image/jpeg")
      console.log("[TAG]   - Type: { id: 3, name: 'front cover' }")
    } else {
      console.log("[TAG] ⚠️ No cover art to embed")
    }
    
    console.log("[TAG] Final tags prepared:")
    console.log("[TAG]   - Title:", finalTags.title || "none")
    console.log("[TAG]   - Artist:", finalTags.artist || "none")
    console.log("[TAG]   - Album:", finalTags.album || "none")
    console.log("[TAG]   - Year:", finalTags.year || "none")
    console.log("[TAG]   - Has image:", !!finalTags.image)
    
    // Copy input file to output first (NodeID3.write needs an existing MP3 file)
    await fsPromises.copyFile(absoluteInputPath, absoluteOutputPath)
    console.log("[TAG] Copied input file to output path")
    
    // Use NodeID3.write() to overwrite the file with metadata
    console.log("[TAG] Calling NodeID3.write() to embed metadata...")
    const writeResult = NodeID3.write(finalTags, absoluteOutputPath)
    
    if (!writeResult) {
      throw new Error("NodeID3.write() failed - returned false")
    }
    
    console.log("[TAG] ✅ NodeID3.write() completed successfully")
    
    const finalStats = fs.statSync(absoluteOutputPath)
    console.log("[AUDIO] Final file written:", absoluteOutputPath)
    console.log("[TAG] Final file size:", finalStats.size, "bytes")
    
    // CRITICAL VERIFICATION: Read back from disk
    console.log("[TAG-VERIFY] ========== VERIFICATION ==========")
    const fileFromDisk = await fsPromises.readFile(absoluteOutputPath)
    const readTags = NodeID3.read(fileFromDisk)
    
    console.log("[TAG-VERIFY] Reading tags from final file...")
    console.log("[TAG-VERIFY] Has image:", readTags.image !== undefined)
    
    // Verify image was embedded
    if (readTags.image !== undefined) {
      if (typeof readTags.image === "object" && readTags.image !== null) {
        const imageBufferLength = readTags.image.imageBuffer?.length || 0
        console.log("[VERIFY] Image buffer length:", imageBufferLength)
        
        if (imageBufferLength > 0) {
          console.log("[TAG-VERIFY] ✅ VERIFICATION SUCCESS - Image buffer is populated!")
          console.log("[TAG-VERIFY] ✅ APIC frame exists in final file!")
        } else {
          console.error("[TAG-VERIFY] ❌ VERIFICATION FAILED - Image buffer is empty!")
          throw new Error("Cover art verification failed: image buffer is empty after write")
        }
      } else {
        console.error("[TAG-VERIFY] ❌ VERIFICATION FAILED - Image is not an object!")
        throw new Error("Cover art verification failed: image is not embedded object")
      }
    } else {
      if (coverImageBuffer && coverImageBuffer.length > 0) {
        console.error("[TAG-VERIFY] ❌ VERIFICATION FAILED - Image tag missing!")
        console.error("[TAG-VERIFY] Cover art was provided but not embedded in final file!")
        throw new Error("Cover art verification failed: image tag missing in final file")
      } else {
        console.log("[TAG-VERIFY] No cover art was provided, skipping image verification")
      }
    }
    
    console.log("[TAG-VERIFY] ==================================")
    console.log("[TAG] ======================================")
    
    return absoluteOutputPath
  } catch (error: any) {
    console.error("[TAG] ❌ Error processing metadata:", error.message)
    console.error("[TAG] Stack:", error.stack)
    throw error
  }
}
