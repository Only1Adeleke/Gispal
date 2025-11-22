import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { mixAudio, JingleConfig } from "@/lib/ffmpeg"
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      audioUrl, 
      audioSource, // Alternative to audioUrl
      jingles, // Array of { jingleId, position, volume }
      coverArtId,
      coverArtSource, // "custom" | "extracted" | "wp_media"
      extractedCoverArtUrl, // URL if using extracted cover
      previewOnly,
      metadata // { title, artist, album, genre }
    } = body

    const audioSourceUrl = audioUrl || audioSource
    if (!audioSourceUrl) {
      return NextResponse.json({ error: "audioUrl or audioSource is required" }, { status: 400 })
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
        console.error("Error creating user in mix route:", error)
        return NextResponse.json(
          { error: "Failed to initialize user data" },
          { status: 500 }
        )
      }
    }

    const isPro = isProPlan(user.plan)
    const maxJingles = getMaxJingles(user.plan)

    // Enforce jingle limits
    if (jingles && jingles.length > maxJingles) {
      return NextResponse.json(
        { error: `Maximum ${maxJingles} jingle(s) allowed for your plan` },
        { status: 403 }
      )
    }

    // Enforce position selection (free users can only use "start")
    if (jingles && !isPro) {
      for (const jingle of jingles) {
        if (jingle.position && jingle.position !== "start") {
          return NextResponse.json(
            { error: "Jingle position selection is only available for Pro plans" },
            { status: 403 }
          )
        }
      }
    }

    // Enforce volume control (free users cannot control volume)
    if (jingles && !isPro) {
      for (const jingle of jingles) {
        if (jingle.volume !== undefined && jingle.volume !== 1.0) {
          return NextResponse.json(
            { error: "Jingle volume control is only available for Pro plans" },
            { status: 403 }
          )
        }
      }
    }

    // Enforce preview-only for free users
    const isPreview = previewOnly !== undefined ? previewOnly : !isPro
    if (!isPro && !isPreview) {
      return NextResponse.json(
        { error: "Full export is only available for Pro plans" },
        { status: 403 }
      )
    }

    // Handle cover art source restrictions
    if (coverArtSource === "extracted" && !isPro) {
      return NextResponse.json(
        { error: "Extracted cover art is only available for Pro plans" },
        { status: 403 }
      )
    }

    // Check bandwidth limits
    if (user.bandwidthUsed >= user.bandwidthLimit) {
      return NextResponse.json(
        { error: "Bandwidth limit exceeded" },
        { status: 403 }
      )
    }

    // Process jingles
    const jingleConfigs: JingleConfig[] = []
    if (jingles && jingles.length > 0) {
      for (const jingle of jingles) {
        const jingleRecord = await db.jingles.findById(jingle.jingleId)
        if (!jingleRecord || jingleRecord.userId !== session.user.id) {
          return NextResponse.json({ error: `Jingle ${jingle.jingleId} not found` }, { status: 404 })
        }
        
        // Download jingle to temp
        const jingleResponse = await fetch(jingleRecord.fileUrl)
        const jingleBuffer = await jingleResponse.arrayBuffer()
        const jingleFilename = `jingle_${Date.now()}_${jingle.jingleId}.mp3`
        const jinglePath = await tempStorage.save(Buffer.from(jingleBuffer), jingleFilename)
        
        jingleConfigs.push({
          path: jinglePath,
          position: jingle.position || "start",
          volume: jingle.volume !== undefined ? jingle.volume : 1.0,
        })
      }
    }

    // Get cover art if provided
    let coverArtPath: string | undefined
    if (coverArtId && coverArtSource === "custom") {
      const coverArt = await db.coverArts.findById(coverArtId)
      if (!coverArt || coverArt.userId !== session.user.id) {
        return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
      }
      // Download cover art to temp
      const coverResponse = await fetch(coverArt.fileUrl)
      const coverBuffer = await coverResponse.arrayBuffer()
      const coverFilename = `cover_${Date.now()}.jpg`
      coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
    } else if (coverArtSource === "extracted" && extractedCoverArtUrl) {
      // Download extracted cover art
      const coverResponse = await fetch(extractedCoverArtUrl)
      const coverBuffer = await coverResponse.arrayBuffer()
      const coverFilename = `cover_extracted_${Date.now()}.jpg`
      coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
    } else if (coverArtSource === "wp_media" && coverArtId) {
      // WordPress media upload - should be handled by wp/upload-cover endpoint
      // For now, treat as custom
      const coverArt = await db.coverArts.findById(coverArtId)
      if (coverArt) {
        const coverResponse = await fetch(coverArt.fileUrl)
        const coverBuffer = await coverResponse.arrayBuffer()
        const coverFilename = `cover_wp_${Date.now()}.jpg`
        coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
      }
    }

    // Mix audio
    const outputPath = await mixAudio({
      audioUrl: audioSourceUrl,
      jingles: jingleConfigs,
      coverArtPath,
      previewOnly: isPreview,
      previewDuration: getPreviewDuration(),
      metadata,
    })

    // Read output file
    const outputBuffer = await fs.readFile(outputPath)
    const outputSize = outputBuffer.length

    // Update bandwidth usage
    await db.users.update(session.user.id, {
      bandwidthUsed: user.bandwidthUsed + outputSize,
    })

    let outputUrl: string
    const tempDuration = getTempStorageDuration(user.plan)
    
    if (isPreview || !canSavePermanently(user.plan)) {
      // For preview or free users, serve from temp storage (10 minutes)
      const filename = path.basename(outputPath)
      outputUrl = `/api/temp/${filename}`
      
      // Schedule deletion after temp duration
      setTimeout(() => {
        fs.unlink(outputPath).catch(() => {})
      }, tempDuration)
    } else {
      // Upload to permanent storage for Pro users
      const fileKey = `mixes/${session.user.id}/${Date.now()}_mix.mp3`
      outputUrl = await storage.upload(outputBuffer, fileKey, "audio/mpeg")
      // Clean up temp file
      await fs.unlink(outputPath).catch(() => {})
    }

    // Save mix record
    const mix = await db.mixes.create({
      userId: session.user.id,
      audioUrl: audioSourceUrl,
      jingleId: jingles?.[0]?.jingleId, // Store first jingle ID for backward compatibility
      coverArtId,
      position: jingles?.[0]?.position || "start",
      outputUrl,
      isPreview: isPreview,
    })

    // Clean up temp jingle files
    for (const jingleConfig of jingleConfigs) {
      await fs.unlink(jingleConfig.path).catch(() => {})
    }
    if (coverArtPath) {
      // Only delete if it's a temp file (extracted or wp_media)
      if (coverArtSource === "extracted" || coverArtSource === "wp_media") {
        if (!isPro) {
          // Free users: delete temp cover art immediately
          await fs.unlink(coverArtPath).catch(() => {})
        }
        // Pro users: keep it (already uploaded to storage if needed)
      }
    }

    return NextResponse.json({
      id: mix.id,
      outputUrl,
      isPreview: isPreview,
      expiresAt: isPreview || !canSavePermanently(user.plan) 
        ? new Date(Date.now() + tempDuration).toISOString()
        : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mix audio" },
      { status: 500 }
    )
  }
}

