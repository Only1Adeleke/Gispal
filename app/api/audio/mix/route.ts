import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration } from "@/lib/ffmpeg"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

interface MixRequest {
  audioId: string
  jingleId: string
  position: "start" | "middle" | "end" | "start-end"
  volume?: number // 0.0 to 1.0, default 1.0
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body: MixRequest = await request.json()
    const { audioId, jingleId, position, volume = 1.0 } = body

    if (!audioId || !jingleId || !position) {
      return NextResponse.json(
        { error: "audioId, jingleId, and position are required" },
        { status: 400 }
      )
    }

    if (!["start", "middle", "end", "start-end"].includes(position)) {
      return NextResponse.json(
        { error: "Invalid position. Must be 'start', 'middle', 'end', or 'start-end'" },
        { status: 400 }
      )
    }

    if (volume < 0 || volume > 1) {
      return NextResponse.json(
        { error: "Volume must be between 0.0 and 1.0" },
        { status: 400 }
      )
    }

    // Fetch audio and jingle from database
    const audio = await db.audios.findById(audioId)
    if (!audio) {
      return NextResponse.json(
        { error: "Audio not found" },
        { status: 404 }
      )
    }

    const jingle = await db.audios.findById(jingleId)
    if (!jingle) {
      return NextResponse.json(
        { error: "Jingle not found" },
        { status: 404 }
      )
    }

    // Get file paths
    const audioPath = path.join(process.cwd(), "uploads", path.basename(audio.url))
    const jinglePath = path.join(process.cwd(), "uploads", path.basename(jingle.url))

    // Check if files exist
    try {
      await fs.access(audioPath)
      await fs.access(jinglePath)
    } catch {
      return NextResponse.json(
        { error: "Audio or jingle file not found on disk" },
        { status: 404 }
      )
    }

    // Get durations
    const audioDuration = await getAudioDuration(audioPath)
    const jingleDuration = await getAudioDuration(jinglePath)

    // Generate output filename
    const outputFilename = `mixed-${randomUUID()}.mp3`
    const outputPath = path.join(process.cwd(), "uploads", outputFilename)

    // Create ffmpeg command
    return new Promise<NextResponse>((resolve, reject) => {
      try {
        let command = ffmpeg(audioPath)
        const filters: string[] = []
        let inputIndex = 1

        // Add jingle as input
        command = command.input(jinglePath)

        // Calculate positions for jingle(s)
        const positions: number[] = []
        
        if (position === "start") {
          positions.push(0)
        } else if (position === "middle") {
          positions.push(Math.max(0, (audioDuration - jingleDuration) / 2))
        } else if (position === "end") {
          positions.push(Math.max(0, audioDuration - jingleDuration))
        } else if (position === "start-end") {
          positions.push(0)
          positions.push(Math.max(0, audioDuration - jingleDuration))
        }

        // For start-end, we need to add the jingle input multiple times
        // or use the same input with different delays
        // We'll add the input once and create multiple delayed streams from it
        const jingleStream = `[${inputIndex}:a]`
        const jingleStreams: string[] = []
        
        // First, apply volume if needed (only once)
        let processedJingleStream = jingleStream
        if (volume !== 1.0) {
          processedJingleStream = "[jingle_volume]"
          filters.push(`${jingleStream}volume=${volume}${processedJingleStream}`)
        }
        
        // Create delayed streams for each position
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i]
          const delayMs = Math.round(pos * 1000)
          const jingleDelayed = `[jingle_${i}_delayed]`
          
          filters.push(
            `${processedJingleStream}adelay=${delayMs}|${delayMs}${jingleDelayed}`
          )
          
          jingleStreams.push(jingleDelayed)
        }

        // Mix all streams together
        const mainAudioStream = "[0:a]"
        const allInputs = [mainAudioStream, ...jingleStreams].join("")
        const mixOutput = "[audio_mixed]"
        
        filters.push(
          `${allInputs}amix=inputs=${1 + jingleStreams.length}:duration=longest:dropout_transition=0${mixOutput}`
        )

        // Apply filters and set output
        command
          .complexFilter(filters)
          .outputOptions(["-map", mixOutput])
          .outputOptions(["-c:a", "libmp3lame", "-b:a", "192k"])
          .output(outputPath)
          .on("end", async () => {
            try {
              // Get duration of mixed file
              const mixedDuration = await getAudioDuration(outputPath).catch(() => audioDuration)

              // Create tags array
              const originalTags = audio.tags ? audio.tags.split(",").map(t => t.trim()) : []
              const mixedTags = ["mixed", ...originalTags].join(", ")

              // Create new audio entry
              const mixedAudio = await db.audios.create({
                title: `${audio.title} (Mixed)`,
                tags: mixedTags,
                url: `/uploads/${outputFilename}`,
                duration: Math.round(mixedDuration),
                parentId: audioId,
              })

              resolve(NextResponse.json(mixedAudio))
            } catch (error: any) {
              console.error("Error saving mixed audio:", error)
              reject(NextResponse.json(
                { error: "Failed to save mixed audio" },
                { status: 500 }
              ))
            }
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err)
            reject(NextResponse.json(
              { error: `Mixing failed: ${err.message}` },
              { status: 500 }
            ))
          })
          .run()
      } catch (error: any) {
        console.error("Mixing error:", error)
        reject(NextResponse.json(
          { error: error.message || "Failed to mix audio" },
          { status: 500 }
        ))
      }
    })
  } catch (error: any) {
    console.error("Audio mix error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to mix audio" },
      { status: 500 }
    )
  }
}

