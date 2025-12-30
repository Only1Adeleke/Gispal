import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { mixAudio, JingleConfig, getAudioDuration } from "@/lib/ffmpeg"
import { storage, tempStorage } from "@/lib/storage"
import { 
  getMaxJingles, 
  canFullExport, 
  canSelectJinglePosition,
  canControlJingleVolume,
  canSavePermanently,
  getTempStorageDuration,
  getPreviewDuration,
  isProPlan
} from "@/lib/plan-restrictions"
import fs from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import NodeID3 from "node-id3"

/**
 * Resolve file path from storage URL
 * Handles /api/storage/, /storage/, /uploads/, and remote URLs
 */
async function resolveFilePathFromUrl(fileUrl: string): Promise<string> {
  // Remote URL - download to temp storage
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    console.log("[MIX] Resolving remote URL:", fileUrl)
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch remote file: ${fileUrl}`)
    }
    const buffer = await response.arrayBuffer()
    const filename = `temp_${randomUUID()}.${fileUrl.split('.').pop() || 'mp3'}`
    return await tempStorage.save(Buffer.from(buffer), filename)
  }
  
  // Local storage paths
  let filePath: string
  
  if (fileUrl.startsWith("/api/storage/")) {
    // /api/storage/jingles/... -> storage/jingles/...
    filePath = path.join(process.cwd(), fileUrl.replace("/api/storage/", "storage/"))
  } else if (fileUrl.startsWith("/storage/")) {
    // /storage/jingles/... -> storage/jingles/...
    filePath = path.join(process.cwd(), fileUrl)
  } else if (fileUrl.startsWith("/uploads/")) {
    // /uploads/... -> uploads/...
    filePath = path.join(process.cwd(), fileUrl)
  } else {
    // Assume relative path
    filePath = path.join(process.cwd(), fileUrl)
  }
  
  // Verify file exists
  try {
    await fs.access(filePath)
    return filePath
  } catch {
    throw new Error(`File not found: ${filePath} (resolved from ${fileUrl})`)
  }
}

/**
 * Load audio file from storage URL
 * Returns filesystem path to the audio file
 */
async function loadAudioFromStorage(fileUrl: string): Promise<string> {
  return await resolveFilePathFromUrl(fileUrl)
}

/**
 * Load image file from storage URL
 * Returns filesystem path to the image file
 */
async function loadImageFromStorage(fileUrl: string): Promise<string> {
  return await resolveFilePathFromUrl(fileUrl)
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Safe number parser - ensures valid finite numbers
 */
function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Parse FormData or JSON request
 */
async function parseRequest(request: NextRequest): Promise<{
  isFormData: boolean
  data: any
  files: {
    audioFile?: File
    jingleFile?: File
    coverArt?: File
  }
}> {
  const contentType = request.headers.get("content-type") || ""
  
  if (contentType.includes("multipart/form-data")) {
    // Handle FormData
    const formData = await request.formData()
    const files: any = {}
    const data: any = {}
    
    // Extract files
    const audioFile = formData.get("audioFile") as File | null
    const jingleFile = formData.get("jingleFile") as File | null
    const coverArt = formData.get("coverArt") as File | null
    
    if (audioFile && audioFile instanceof File) {
      files.audioFile = audioFile
    }
    if (jingleFile && jingleFile instanceof File) {
      files.jingleFile = jingleFile
    }
    if (coverArt && coverArt instanceof File) {
      files.coverArt = coverArt
    }
    
    // Extract form fields
    data.audioUrl = formData.get("audioUrl") as string | null
    data.sourceType = formData.get("sourceType") as string | null
    data.jingleId = formData.get("jingleId") as string | null
    data.jinglePlacement = formData.get("jinglePlacement") as string | null
    data.midrollTimestamp = formData.get("midrollTimestamp") as string | null
    data.title = formData.get("title") as string | null
    data.artist = formData.get("artist") as string | null
    data.album = formData.get("album") as string | null
    data.genre = formData.get("genre") as string | null
    data.year = formData.get("year") as string | null
    data.isrc = formData.get("isrc") as string | null
    data.description = formData.get("description") as string | null
    
    return { isFormData: true, data, files }
  } else {
    // Handle JSON (legacy support)
    try {
      const raw = await request.text()
      let body
      try {
        body = JSON.parse(raw)
      } catch (parseError) {
        return NextResponse.json(
          { error: "Invalid request payload" },
          { status: 400 }
        ) as any
      }
      return { isFormData: false, data: body, files: {} }
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to parse request" },
        { status: 400 }
      ) as any
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request (FormData or JSON)
    const parsed = await parseRequest(request)
    if (parsed instanceof NextResponse) {
      return parsed // Error response
    }
    
    const { isFormData, data, files } = parsed

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
      } catch (error) {
        console.error("Error creating user in mix route:", error)
        return NextResponse.json(
          { error: "Failed to initialize user data" },
          { status: 500 }
        )
      }
    }

    const isPro = isProPlan(user.plan)
    const maxJingles = getMaxJingles(user.plan)
    const isPreview = !isPro // Free users get preview only

    // Handle FormData workflow
    if (isFormData) {
      // Validate audio source
      let audioSourceUrl: string
      if (files.audioFile) {
        // Save uploaded file
        const arrayBuffer = await files.audioFile.arrayBuffer()
        const filename = `audio_${randomUUID()}.${files.audioFile.name.split('.').pop() || 'mp3'}`
        const audioPath = await tempStorage.save(Buffer.from(arrayBuffer), filename)
        audioSourceUrl = audioPath
      } else if (data.audioUrl) {
        audioSourceUrl = data.audioUrl
      } else {
      return NextResponse.json(
          { error: "audioFile or audioUrl is required" },
          { status: 400 }
        )
      }

      // DETERMINISTIC JINGLE RESOLUTION (server-side, no frontend dependency)
      const jingleConfigs: JingleConfig[] = []
      
      // Query user jingles directly
      const userJingles = await db.jingles.findByUserId(session.user.id)
      console.log("[MIX] ========== JINGLE RESOLUTION ==========")
      console.log("[MIX] User jingles found:", userJingles.length)
      
      let resolvedJinglePath: string | null = null
      let jingleResolvedFrom = "none"
      
      // Priority 1: Uploaded jingle file
      if (files.jingleFile) {
        const arrayBuffer = await files.jingleFile.arrayBuffer()
        const filename = `jingle_${randomUUID()}.${files.jingleFile.name.split('.').pop() || 'mp3'}`
        resolvedJinglePath = await tempStorage.save(Buffer.from(arrayBuffer), filename)
        jingleResolvedFrom = "upload"
        console.log("[MIX] Resolved jingle path: UPLOADED FILE")
        console.log("[MIX] Resolved jingle path:", resolvedJinglePath)
      }
      // Priority 2: Explicitly selected jingle from library
      else if (data.jingleId) {
        const jingleRecord = await db.jingles.findById(data.jingleId)
        if (!jingleRecord || jingleRecord.userId !== session.user.id) {
          return NextResponse.json({ error: "Jingle not found" }, { status: 404 })
        }
        resolvedJinglePath = await loadAudioFromStorage(jingleRecord.fileUrl)
        jingleResolvedFrom = "database"
        console.log("[MIX] Resolved jingle path: SELECTED FROM LIBRARY")
        console.log("[MIX] Resolved jingle path:", resolvedJinglePath)
      }
      // Priority 3: Most recently uploaded jingle (deterministic default)
      else if (userJingles.length > 0) {
        // Sort by createdAt descending, get newest
        const sortedJingles = [...userJingles].sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        )
        const newestJingle = sortedJingles[0]
        
        if (newestJingle && newestJingle.fileUrl) {
          resolvedJinglePath = await loadAudioFromStorage(newestJingle.fileUrl)
          jingleResolvedFrom = "newest-default"
          console.log("[MIX] Resolved jingle path: NEWEST JINGLE (deterministic default)")
          console.log("[MIX] Resolved jingle path:", resolvedJinglePath)
          console.log("[MIX] Jingle ID:", newestJingle.id)
          console.log("[MIX] Jingle name:", newestJingle.name)
          console.log("[MIX] Jingle uploaded:", newestJingle.createdAt.toISOString())
        }
      }
      
      // Plan-based automatic placement:
      // FREE: Intro only
      // PAID: Intro + Outro by default, Midroll if user selected
      let placements: string[] = []
      if (isPro) {
        placements = ["intro", "outro"]
        const userPlacement = (data.jinglePlacement as string) || ""
        if (userPlacement === "midroll") {
          placements.push("midroll")
        }
      } else {
        placements = ["intro"]
      }
      
      // ENFORCE JINGLE INJECTION: If jingle exists, it MUST be used
      if (resolvedJinglePath) {
        for (const placement of placements) {
          const position = placement === "intro" ? "start" : placement === "outro" ? "end" : "middle"
          jingleConfigs.push({
            path: resolvedJinglePath,
            position: position as "start" | "middle" | "end",
            volume: 1.0,
          })
        }
        console.log("[MIX] ✅ Jingle added to config")
        console.log("[MIX] Jingle placements:", placements.join(", "))
        console.log("[MIX] Jingle configs count:", jingleConfigs.length)
      } else {
        console.log("[MIX] No jingle resolved (user has no jingles)")
      }
      console.log("[MIX] ======================================")

      // Process cover art - resolve default brand cover art if needed
      let coverArtPath: string | undefined
      let coverArtResolvedFrom = "none"
      
      if (files.coverArt) {
        // Uploaded cover art takes priority
        const arrayBuffer = await files.coverArt.arrayBuffer()
        const filename = `cover_${randomUUID()}.${files.coverArt.name.split('.').pop() || 'jpg'}`
        coverArtPath = await tempStorage.save(Buffer.from(arrayBuffer), filename)
        coverArtResolvedFrom = "upload"
        console.log("[MIX] Cover art resolved from: upload")
      } else {
        // Try to resolve default brand cover art
        const userCoverArts = await db.coverArts.findByUserId(session.user.id)
        const defaultCoverArt = userCoverArts.find(art => art.isDefault) || userCoverArts[0]
        
        if (defaultCoverArt) {
          try {
            coverArtPath = await loadImageFromStorage(defaultCoverArt.fileUrl)
            coverArtResolvedFrom = "brand-default"
            console.log("[MIX] Cover art resolved from: brand-default (coverArtId:", defaultCoverArt.id, ", path:", coverArtPath, ")")
          } catch (error: any) {
            console.error("[MIX] Failed to load default cover art from storage:", error.message)
            // Don't fail the request if cover art can't be loaded - just log warning
            console.warn("[MIX] Continuing without cover art")
          }
        }
      }

      // Prepare metadata
      const metadata = {
        title: data.title || "",
        artist: data.artist || "",
        album: data.album || "",
        genre: data.genre || "",
        year: data.year || new Date().getFullYear().toString(),
        isrc: data.isrc || "",
        description: data.description || "",
      }

      // Get input audio duration for validation
      const inputAudioDuration = await getAudioDuration(audioSourceUrl)
      
      // Mix audio (without metadata/cover art - those are applied after)
      const mixedAudioPath = await mixAudio({
        audioUrl: audioSourceUrl,
        jingles: jingleConfigs,
        coverArtPath: undefined, // Don't pass cover art to mixAudio - we'll embed it after
        previewOnly: isPreview,
        previewDuration: getPreviewDuration(),
        metadata: undefined, // Don't pass metadata to mixAudio - we'll embed it after
      })

      // Verify mixed audio before post-processing
      const mixedStats = await fs.stat(mixedAudioPath)
      const mixedDuration = await getAudioDuration(mixedAudioPath)
      console.log("[MIX] ========== MIXED AUDIO VERIFICATION ==========")
      console.log("[MIX] MIXED FILE PATH:", mixedAudioPath)
      console.log("[MIX] MIXED FILE SIZE:", mixedStats.size, "bytes")
      console.log("[MIX] MIXED DURATION:", mixedDuration, "seconds")
      console.log("[MIX] INPUT DURATION:", inputAudioDuration, "seconds")
      console.log("[MIX] ==============================================")
      
      // HARD FAIL: If jingle was resolved, mixed duration must be longer
      if (jingleConfigs.length > 0) {
        const hasIntroOutro = jingleConfigs.some(j => j.position === "start" || j.position === "end")
        if (hasIntroOutro && mixedDuration <= inputAudioDuration) {
          throw new Error(`JINGLE RESOLVED BUT MIXED OUTPUT DOES NOT CONTAIN IT. Input: ${inputAudioDuration}s, Mixed: ${mixedDuration}s`)
        }
      }
      
      // Embed metadata and cover art into the mixed audio (node-id3 preserves audio)
      const finalOutputPath = path.join(
        path.dirname(mixedAudioPath),
        `final-${randomUUID()}.mp3`
      )
      
      // Ensure output directory exists
      const outputDir = path.dirname(finalOutputPath)
      await fs.mkdir(outputDir, { recursive: true })
      
      console.log("[MIX] Embedding metadata and cover art...")
      console.log("[MIX]   - Mixed audio:", mixedAudioPath)
      console.log("[MIX]   - Final output:", finalOutputPath)
      
      // Embed metadata and cover art using node-id3
      const audioBuffer = await fs.readFile(mixedAudioPath)
      const tags: NodeID3.Tags = {
        title: metadata.title || undefined,
        artist: metadata.artist || undefined,
        album: metadata.album || undefined,
        year: metadata.year || new Date().getFullYear().toString(),
        genre: metadata.genre || undefined,
      }
      
      // Add cover art if available
      if (coverArtPath) {
        try {
          const coverBuffer = await fs.readFile(coverArtPath)
          tags.image = {
            mime: "image/jpeg",
            type: {
              id: 3,
              name: "front cover"
            },
            description: "Cover",
            imageBuffer: coverBuffer,
          }
          console.log("[MIX] ✅ Cover art prepared for embedding (", coverBuffer.length, "bytes)")
        } catch (error: any) {
          console.error("[MIX] ⚠️ Failed to load cover art:", error.message)
        }
      }
      
      // Write tags to audio buffer (node-id3 preserves audio data)
      const taggedBuffer = NodeID3.update(tags, audioBuffer)
      if (!taggedBuffer) {
        throw new Error("Failed to embed metadata and cover art")
      }
      
      // Write final output file
      await fs.writeFile(finalOutputPath, taggedBuffer)
      
      // VERIFY final output duration matches mixed audio
      const finalDuration = await getAudioDuration(finalOutputPath)
      console.log("[MIX] ========== FINAL OUTPUT VERIFICATION ==========")
      console.log("[MIX] FINAL FILE PATH:", finalOutputPath)
      console.log("[MIX] FINAL FILE SIZE:", (await fs.stat(finalOutputPath)).size, "bytes")
      console.log("[MIX] FINAL DURATION:", finalDuration, "seconds")
      console.log("[MIX] MIXED DURATION:", mixedDuration, "seconds")
      console.log("[MIX] ==============================================")
      
      // HARD FAIL: Final duration must match mixed duration (node-id3 should not change audio)
      if (Math.abs(finalDuration - mixedDuration) > 0.5) {
        throw new Error(`FINAL OUTPUT DURATION MISMATCH. Mixed: ${mixedDuration}s, Final: ${finalDuration}s`)
      }
      
      // HARD FAIL: If user has jingles and output duration == input duration, jingle was not mixed
      if (userJingles.length > 0 && finalDuration <= inputAudioDuration) {
        throw new Error(`Default brand jingle resolved but not mixed into output. Input: ${inputAudioDuration}s, Final: ${finalDuration}s, Jingle resolved: ${resolvedJinglePath || "none"}`)
      }
      
      // HARD FAIL: If jingle was explicitly resolved, final duration must be longer
      if (resolvedJinglePath && jingleConfigs.length > 0) {
        const hasIntroOutro = jingleConfigs.some(j => j.position === "start" || j.position === "end")
        if (hasIntroOutro && finalDuration <= inputAudioDuration) {
          throw new Error(`JINGLE RESOLVED BUT FINAL OUTPUT DOES NOT CONTAIN IT. Input: ${inputAudioDuration}s, Final: ${finalDuration}s, Resolved path: ${resolvedJinglePath}`)
        }
      }
      
      console.log("[MIX] ========== FINAL VALIDATION ==========")
      console.log("[MIX] User has jingles:", userJingles.length)
      console.log("[MIX] Jingle resolved:", !!resolvedJinglePath)
      console.log("[MIX] Resolved jingle path:", resolvedJinglePath || "none")
      console.log("[MIX] Jingle configs:", jingleConfigs.length)
      console.log("[MIX] Input duration:", inputAudioDuration, "seconds")
      console.log("[MIX] Final output duration:", finalDuration, "seconds")
      console.log("[MIX] ======================================")
      
      console.log("[MIX] ✅ Metadata and cover art embedded successfully")
      
      // Clean up mixed audio file (no longer needed)
      await fs.unlink(mixedAudioPath).catch(() => {})
      
      // Read final output file
      const outputBuffer = await fs.readFile(finalOutputPath)
      const outputSize = outputBuffer.length

      // Update bandwidth usage
      await db.users.update(session.user.id, {
        bandwidthUsed: user.bandwidthUsed + outputSize,
      })

      let outputUrl: string
      const tempDuration = getTempStorageDuration(user.plan)
      
      if (isPreview || !canSavePermanently(user.plan)) {
        const filename = path.basename(finalOutputPath)
        outputUrl = `/api/temp/${filename}`
        
        setTimeout(() => {
          fs.unlink(finalOutputPath).catch(() => {})
        }, tempDuration)
      } else {
        const fileKey = `mixes/${session.user.id}/${Date.now()}_mix.mp3`
        outputUrl = await storage.upload(outputBuffer, fileKey, "audio/mpeg")
        await fs.unlink(finalOutputPath).catch(() => {})
      }

      // Clean up temp files
      for (const jingleConfig of jingleConfigs) {
        await fs.unlink(jingleConfig.path).catch(() => {})
      }

      return NextResponse.json({
        outputUrl,
        isPreview: isPreview,
        expiresAt: isPreview || !canSavePermanently(user.plan) 
          ? new Date(Date.now() + tempDuration).toISOString()
          : undefined,
      })
    }

    // Legacy JSON handling (existing code)
    const { 
      audioUrl, 
      audioSource,
      jingles,
      coverArtId,
      coverArtSource,
      extractedCoverArtUrl,
      previewOnly,
      metadata
    } = data

    const audioSourceUrl = audioUrl || audioSource
    if (!audioSourceUrl) {
      return NextResponse.json({ error: "audioUrl or audioSource is required" }, { status: 400 })
    }

    // Enforce jingle limits
    if (jingles && jingles.length > maxJingles) {
      return NextResponse.json(
        { error: `Maximum ${maxJingles} jingle(s) allowed for your plan` },
        { status: 403 }
      )
    }

    // Process jingles (legacy)
    const jingleConfigs: JingleConfig[] = []
    if (jingles && jingles.length > 0) {
      for (const jingle of jingles) {
        const jingleRecord = await db.jingles.findById(jingle.jingleId)
        if (!jingleRecord || jingleRecord.userId !== session.user.id) {
          return NextResponse.json({ error: `Jingle ${jingle.jingleId} not found` }, { status: 404 })
        }
        
        const jingleResponse = await fetch(jingleRecord.fileUrl)
        const jingleBuffer = await jingleResponse.arrayBuffer()
        const jingleFilename = `jingle_${Date.now()}_${jingle.jingleId}.mp3`
        const jinglePath = await tempStorage.save(Buffer.from(jingleBuffer), jingleFilename)
        
        jingleConfigs.push({
          path: jinglePath,
          position: jingle.position || "start",
          volume: safeNumber(jingle.volume, 1.0),
        })
      }
    }

    // Get cover art (legacy)
    let coverArtPath: string | undefined
    if (coverArtId && coverArtSource === "custom") {
      const coverArt = await db.coverArts.findById(coverArtId)
      if (!coverArt || coverArt.userId !== session.user.id) {
        return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
      }
      const coverResponse = await fetch(coverArt.fileUrl)
      const coverBuffer = await coverResponse.arrayBuffer()
      const coverFilename = `cover_${Date.now()}.jpg`
      coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
    } else if (coverArtSource === "extracted" && extractedCoverArtUrl) {
      const coverResponse = await fetch(extractedCoverArtUrl)
      const coverBuffer = await coverResponse.arrayBuffer()
      const coverFilename = `cover_extracted_${Date.now()}.jpg`
      coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
    }

    const finalPreview = previewOnly !== undefined ? previewOnly : !isPro

    // Mix audio (legacy)
    const outputPath = await mixAudio({
      audioUrl: audioSourceUrl,
      jingles: jingleConfigs,
      coverArtPath,
      previewOnly: finalPreview,
      previewDuration: getPreviewDuration(),
      metadata,
    })

    const outputBuffer = await fs.readFile(outputPath)
    const outputSize = outputBuffer.length

    await db.users.update(session.user.id, {
      bandwidthUsed: user.bandwidthUsed + outputSize,
    })

    let outputUrl: string
    const tempDuration = getTempStorageDuration(user.plan)
    
    if (finalPreview || !canSavePermanently(user.plan)) {
      const filename = path.basename(outputPath)
      outputUrl = `/api/temp/${filename}`
      setTimeout(() => {
        fs.unlink(outputPath).catch(() => {})
      }, tempDuration)
    } else {
      const fileKey = `mixes/${session.user.id}/${Date.now()}_mix.mp3`
      outputUrl = await storage.upload(outputBuffer, fileKey, "audio/mpeg")
      await fs.unlink(outputPath).catch(() => {})
    }

    // Clean up
    for (const jingleConfig of jingleConfigs) {
      await fs.unlink(jingleConfig.path).catch(() => {})
    }

    return NextResponse.json({
      outputUrl,
      isPreview: finalPreview,
      expiresAt: finalPreview || !canSavePermanently(user.plan) 
        ? new Date(Date.now() + tempDuration).toISOString()
        : undefined,
    })
  } catch (error: any) {
    console.error("[MIX] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to mix audio" },
      { status: 500 }
    )
  }
}
