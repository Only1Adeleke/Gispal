/**
 * YouTube download API endpoint
 * Streams MP3 audio directly from YouTube URL
 */

import { NextRequest, NextResponse } from "next/server"
import { downloadYouTubeAudio } from "@/lib/youtube/downloader"
import { isValidYouTubeUrl } from "@/lib/youtube/downloader"
import { createReadStream, statSync } from "fs"
import { join } from "path"
import { promises as fs } from "fs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")
    
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      )
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      )
    }

    console.log("[DOWNLOAD-YOUTUBE] Starting download for:", url)

    // Download audio
    const result = await downloadYouTubeAudio(url)

    // Create a temporary file to stream from
    const tempDir = join(process.cwd(), "tmp", "youtube")
    await fs.mkdir(tempDir, { recursive: true })
    const tempFilePath = join(tempDir, `stream-${Date.now()}.mp3`)
    await fs.writeFile(tempFilePath, result.buffer)

    // Get file stats
    const stat = statSync(tempFilePath)

    // Create read stream
    const stream = createReadStream(tempFilePath)

    // Clean up file after streaming (in background)
    stream.on("end", () => {
      fs.unlink(tempFilePath).catch(() => {})
    })
    stream.on("error", () => {
      fs.unlink(tempFilePath).catch(() => {})
    })

    // Return streaming response
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.title || "audio")}.mp3"`,
      },
    })
  } catch (error: any) {
    console.error("[DOWNLOAD-YOUTUBE] Download failed:", error)
    return NextResponse.json(
      { error: `Failed to download: ${error.message}` },
      { status: 500 }
    )
  }
}

