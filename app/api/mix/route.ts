import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { mixAudio } from "@/lib/ffmpeg"
import { storage, tempStorage } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { audioUrl, jingleId, coverArtId, position, previewOnly } = body

    if (!audioUrl) {
      return NextResponse.json({ error: "audioUrl is required" }, { status: 400 })
    }

    // Get user to check plan and bandwidth
    const user = await db.users.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check bandwidth limits
    if (user.bandwidthUsed >= user.bandwidthLimit) {
      return NextResponse.json(
        { error: "Bandwidth limit exceeded" },
        { status: 403 }
      )
    }

    // Get jingle if provided
    let jinglePath: string | undefined
    if (jingleId) {
      const jingle = await db.jingles.findById(jingleId)
      if (!jingle || jingle.userId !== session.user.id) {
        return NextResponse.json({ error: "Jingle not found" }, { status: 404 })
      }
      // Download jingle to temp
      const jingleResponse = await fetch(jingle.fileUrl)
      const jingleBuffer = await jingleResponse.arrayBuffer()
      const jingleFilename = `jingle_${Date.now()}.mp3`
      jinglePath = await tempStorage.save(Buffer.from(jingleBuffer), jingleFilename)
    }

    // Get cover art if provided
    let coverArtPath: string | undefined
    if (coverArtId) {
      const coverArt = await db.coverArts.findById(coverArtId)
      if (!coverArt || coverArt.userId !== session.user.id) {
        return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
      }
      // Download cover art to temp
      const coverResponse = await fetch(coverArt.fileUrl)
      const coverBuffer = await coverResponse.arrayBuffer()
      const coverFilename = `cover_${Date.now()}.jpg`
      coverArtPath = await tempStorage.save(Buffer.from(coverBuffer), coverFilename)
    }

    // Mix audio
    const outputPath = await mixAudio({
      audioUrl,
      jinglePath,
      coverArtPath,
      position: position || "start",
      previewOnly: previewOnly || false,
      previewDuration: 30,
    })

    // Read output file
    const outputBuffer = await fs.readFile(outputPath)
    const outputSize = outputBuffer.length

    // Update bandwidth usage
    await db.users.update(session.user.id, {
      bandwidthUsed: user.bandwidthUsed + outputSize,
    })

    let outputUrl: string
    if (previewOnly) {
      // For preview, serve from temp storage
      const filename = path.basename(outputPath)
      outputUrl = `/api/temp/${filename}`
    } else {
      // Upload to permanent storage
      const fileKey = `mixes/${session.user.id}/${Date.now()}_mix.mp3`
      outputUrl = await storage.upload(outputBuffer, fileKey, "audio/mpeg")
    }

    // Save mix record
    const mix = await db.mixes.create({
      userId: session.user.id,
      audioUrl,
      jingleId,
      coverArtId,
      position: position || "start",
      outputUrl,
      isPreview: previewOnly || false,
    })

    // Clean up temp files
    if (jinglePath) await fs.unlink(jinglePath).catch(() => {})
    if (coverArtPath) await fs.unlink(coverArtPath).catch(() => {})
    if (previewOnly) {
      // Keep preview file for 30 minutes
      setTimeout(() => {
        fs.unlink(outputPath).catch(() => {})
      }, 30 * 60 * 1000)
    } else {
      await fs.unlink(outputPath).catch(() => {})
    }

    return NextResponse.json({
      id: mix.id,
      outputUrl,
      isPreview: previewOnly || false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mix audio" },
      { status: 500 }
    )
  }
}

