/**
 * Test endpoint for YouTube download (no auth required for testing)
 */

import { NextRequest, NextResponse } from "next/server"
import { downloadYouTubeAudio, isValidYouTubeUrl } from "@/lib/youtube/downloader"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      )
    }

    console.log("[TEST-YOUTUBE] Starting download for:", url)
    const result = await downloadYouTubeAudio(url)

    return NextResponse.json({
      success: true,
      title: result.title,
      artist: result.artist,
      duration: result.duration,
      bufferSize: result.buffer.length,
      thumbnail: result.thumbnail,
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error("[TEST-YOUTUBE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to download YouTube audio" },
      { status: 500 }
    )
  }
}

