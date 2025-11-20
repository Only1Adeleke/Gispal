import { NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth/api-keys"
import { db } from "@/lib/db"
import { mixAudio } from "@/lib/ffmpeg"
import { storage, tempStorage } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const userId = await verifyApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { audioUrl, jingleId, coverArtId, position } = body

    if (!audioUrl) {
      return NextResponse.json({ error: "audioUrl is required" }, { status: 400 })
    }

    // Get user to check plan and bandwidth
    const user = await db.users.findById(userId)
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
      if (!jingle || jingle.userId !== userId) {
        return NextResponse.json({ error: "Jingle not found" }, { status: 404 })
      }
      const jingleResponse = await fetch(jingle.fileUrl)
      const jingleBuffer = await jingleResponse.arrayBuffer()
      const jingleFilename = `jingle_${Date.now()}.mp3`
      jinglePath = await tempStorage.save(Buffer.from(jingleBuffer), jingleFilename)
    }

    // Get cover art if provided
    let coverArtPath: string | undefined
    if (coverArtId) {
      const coverArt = await db.coverArts.findById(coverArtId)
      if (!coverArt || coverArt.userId !== userId) {
        return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
      }
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
      previewOnly: false,
    })

    // Read output file
    const outputBuffer = await fs.readFile(outputPath)
    const outputSize = outputBuffer.length

    // Update bandwidth usage
    await db.users.update(userId, {
      bandwidthUsed: user.bandwidthUsed + outputSize,
    })

    // Upload to permanent storage
    const fileKey = `mixes/${userId}/${Date.now()}_mix.mp3`
    const outputUrl = await storage.upload(outputBuffer, fileKey, "audio/mpeg")

    // Save mix record
    const mix = await db.mixes.create({
      userId,
      audioUrl,
      jingleId,
      coverArtId,
      position: position || "start",
      outputUrl,
      isPreview: false,
    })

    // Clean up temp files
    if (jinglePath) await fs.unlink(jinglePath).catch(() => {})
    if (coverArtPath) await fs.unlink(coverArtPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        id: mix.id,
        outputUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mix audio" },
      { status: 500 }
    )
  }
}

