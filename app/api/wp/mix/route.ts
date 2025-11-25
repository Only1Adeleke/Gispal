import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkLimits } from "@/lib/billing"
import { getAudioDuration } from "@/lib/ffmpeg"
import { downloadAudiomackAudio, parseAudiomackUrl } from "@/lib/audiomack"
import ytdl from "ytdl-core"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import ffprobeStatic from "ffprobe-static"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Set ffmpeg and ffprobe paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}
if (ffprobeStatic) {
  const ffprobePath = (ffprobeStatic as any).path || ffprobeStatic
  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath)
  }
}

interface WordPressMixRequest {
  apiKey: string
  audioUrl: string
  jingleId: string
  position: "start" | "middle" | "end" | "start-end"
  volume?: number // 0.0 to 1.0, default 1.0
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: WordPressMixRequest = await request.json()
    const { apiKey, audioUrl, jingleId, position, volume = 1.0 } = body

    if (!apiKey || !audioUrl || !jingleId || !position) {
      return NextResponse.json(
        { error: "apiKey, audioUrl, jingleId, and position are required" },
        { status: 400 }
      )
    }

    // Validate API key
    const key = await db.apiKeys.findByKey(apiKey)
    if (!key || !key.active) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Update API key usage
    await db.apiKeys.update(key.id, {
      lastUsedAt: Date.now(),
      usageCount: key.usageCount + 1,
    })

    // Get user
    const user = await db.users.findById(key.userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check WordPress API access (PRO only)
    const userUsage = await db.usage.getOrCreate(user.id)
    const limits = checkLimits(user, userUsage)

    if (!limits.canUseWordPressAPI) {
      return NextResponse.json(
        { error: limits.reason || "WordPress API is only available for PRO users" },
        { status: 403 }
      )
    }

    // Validate position
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

    // Fetch jingle from database
    const jingle = await db.audios.findById(jingleId)
    if (!jingle) {
      return NextResponse.json(
        { error: "Jingle not found" },
        { status: 404 }
      )
    }

    // Download audio from URL
    let audioBuffer: Buffer
    let audioPath: string

    // Determine source and download
    if (ytdl.validateURL(audioUrl)) {
      // YouTube
      const info = await ytdl.getInfo(audioUrl)
      const audioFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      })

      if (!audioFormat) {
        return NextResponse.json(
          { error: "No audio format available for this video" },
          { status: 415 }
        )
      }

      const chunks: Buffer[] = []
      const stream = ytdl.downloadFromInfo(info, { format: audioFormat })
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }
      audioBuffer = Buffer.concat(chunks)
    } else if (parseAudiomackUrl(audioUrl)) {
      // Audiomack
      const result = await downloadAudiomackAudio(audioUrl)
      audioBuffer = result.buffer
    } else {
      // Direct MP3 URL
      const response = await fetch(audioUrl)
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to download audio: ${response.statusText}` },
          { status: response.status }
        )
      }
      const arrayBuffer = await response.arrayBuffer()
      audioBuffer = Buffer.from(arrayBuffer)
    }

    // Save audio to temp file
    const uploadsDir = path.join(process.cwd(), "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const tempAudioFilename = `wp_temp_${Date.now()}.mp3`
    const tempAudioPath = path.join(uploadsDir, tempAudioFilename)
    await writeFile(tempAudioPath, audioBuffer)

    // Get file paths
    const jinglePath = path.join(process.cwd(), "uploads", path.basename(jingle.url))

    // Check if files exist
    try {
      await fs.access(tempAudioPath)
      await fs.access(jinglePath)
    } catch {
      return NextResponse.json(
        { error: "Audio or jingle file not found" },
        { status: 404 }
      )
    }

    // Get durations
    const audioDuration = await getAudioDuration(tempAudioPath)
    const jingleDuration = await getAudioDuration(jinglePath)

    // Generate output filename
    const outputFilename = `wp_mixed-${randomUUID()}.mp3`
    const outputPath = path.join(uploadsDir, outputFilename)

    // Mix audio using FFmpeg
    return new Promise<NextResponse>((resolve, reject) => {
      try {
        let command = ffmpeg(tempAudioPath)
        const filters: string[] = []
        let inputIndex = 1

        // Add jingle as input
        command = command.input(jinglePath)

        // Calculate positions
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

        // Create jingle streams
        const jingleStream = `[${inputIndex}:a]`
        const jingleStreams: string[] = []
        
        // Apply volume if needed
        let processedJingleStream = jingleStream
        if (volume !== 1.0) {
          processedJingleStream = "[jingle_volume]"
          filters.push(`${jingleStream}volume=${volume}${processedJingleStream}`)
        }
        
        // Create delayed streams
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i]
          const delayMs = Math.round(pos * 1000)
          const jingleDelayed = `[jingle_${i}_delayed]`
          
          filters.push(
            `${processedJingleStream}adelay=${delayMs}|${delayMs}${jingleDelayed}`
          )
          
          jingleStreams.push(jingleDelayed)
        }

        // Mix all streams
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
              // Clean up temp file
              await fs.unlink(tempAudioPath).catch(() => {})

              // Get duration of mixed file
              const mixedDuration = await getAudioDuration(outputPath).catch(() => audioDuration)

              // Create new audio entry
              const mixedAudio = await db.audios.create({
                title: `WordPress Mixed Audio (${new Date().toISOString()})`,
                tags: "wordpress,mixed",
                url: `/uploads/${outputFilename}`,
                duration: Math.round(mixedDuration),
              })

              // Record usage
              await db.usage.record(user.id, "wordpress_api", {
                audioUrl,
                jingleId,
                position,
                volume,
                mixedAudioId: mixedAudio.id,
              })

              // Return the URL
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
              resolve(NextResponse.json({
                success: true,
                audioUrl: `${baseUrl}${mixedAudio.url}`,
                audioId: mixedAudio.id,
                duration: mixedAudio.duration,
              }))
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
    console.error("WordPress mix error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    )
  }
}
