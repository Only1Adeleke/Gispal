import { NextRequest, NextResponse } from "next/server"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import ffprobeStatic from "ffprobe-static"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      success: true,
      ffmpeg: {
        installed: !!ffmpegStatic,
        path: ffmpegStatic || "Not found",
        configured: false,
      },
      ffprobe: {
        installed: !!ffprobeStatic,
        path: null as string | null,
        configured: false,
      },
      tests: {
        ffmpegPath: false,
        ffprobePath: false,
        fileExists: false,
      },
    }

    // Configure paths
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic)
      results.ffmpeg.configured = true
      results.tests.ffmpegPath = true
    }

    if (ffprobeStatic) {
      const ffprobePath = (ffprobeStatic as any).path || (ffprobeStatic as any) || ffprobeStatic
      results.ffprobe.path = ffprobePath
      ffmpeg.setFfprobePath(ffprobePath)
      results.ffprobe.configured = true
      results.tests.ffprobePath = true
    }

    // Test if files exist
    if (ffmpegStatic) {
      try {
        await fs.access(ffmpegStatic)
        results.tests.fileExists = true
      } catch {
        results.tests.fileExists = false
      }
    }

    // Test ffprobe with a simple command
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg.ffprobe("/dev/null", (err) => {
          if (err && err.message.includes("No such file")) {
            // This is expected - we just want to see if ffprobe is accessible
            resolve()
          } else if (err && err.message.includes("ffprobe")) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      results.tests.ffprobeWorks = true
    } catch (error: any) {
      results.tests.ffprobeWorks = false
      results.tests.ffprobeError = error.message
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

