import { NextResponse } from "next/server"
import { mixAudio } from "@/lib/ffmpeg"
import { tempStorage } from "@/lib/storage"
import fs from "fs/promises"

export async function GET() {
  try {
    // Create a 1-second silent MP3
    const silentBuffer = Buffer.from([]) // In production, generate actual silent MP3
    const silentPath = await tempStorage.save(silentBuffer, "silent_test.mp3")

    // Create a placeholder jingle
    const jinglePath = await tempStorage.save(silentBuffer, "jingle_test.mp3")

    const outputPath = await mixAudio({
      audioUrl: silentPath,
      jinglePath,
      position: "start",
      previewOnly: false,
    })

    // Clean up
    await fs.unlink(silentPath).catch(() => {})
    await fs.unlink(jinglePath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "FFmpeg test completed",
      outputPath,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "FFmpeg test failed" },
      { status: 500 }
    )
  }
}

