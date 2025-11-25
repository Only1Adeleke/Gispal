import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAudioDuration } from "@/lib/ffmpeg"
import { checkLimits, checkJingleDurationLimit } from "@/lib/billing"
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

    // Get user and check limits
    // Get or create user in our database
    let user = await db.users.findById(session.user.id)
    if (!user) {
      // Create user in our database if they don't exist (first time accessing)
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
        // Set first user as admin
        const allUsers = await db.users.findAll()
        if (allUsers.length === 1) {
          user = await db.users.update(user.id, { role: "admin" })
        }
      } catch (error: any) {
        console.error("Error creating user:", error)
        return NextResponse.json(
          { error: "Failed to initialize user account" },
          { status: 500 }
        )
      }
    }

    const userUsage = await db.usage.getOrCreate(session.user.id)
    const limits = checkLimits(user, userUsage)

    if (!limits.canMix) {
      return NextResponse.json(
        { error: limits.reason || "Mixing limit reached" },
        { status: 403 }
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

    const jingle = await db.jingles.findById(jingleId)
    if (!jingle) {
      return NextResponse.json(
        { error: "Jingle not found" },
        { status: 404 }
      )
    }
    
    console.log(`[MIX] Starting mix: audioId=${audioId}, jingleId=${jingleId}, position=${position}, volume=${volume}`)

    // Check jingle duration limit for free tier
    if (jingle.duration) {
      const jingleLimit = checkJingleDurationLimit(user.plan, jingle.duration)
      if (!jingleLimit.allowed) {
        return NextResponse.json(
          { error: jingleLimit.reason || "Jingle duration limit exceeded" },
          { status: 403 }
        )
      }
    }

    // Get file paths - handle both /uploads/ and /api/storage/ URLs
    let audioPath: string
    if (audio.url.startsWith("/uploads/")) {
      audioPath = path.join(process.cwd(), "uploads", path.basename(audio.url))
    } else if (audio.url.startsWith("/api/storage/") || audio.url.startsWith("/storage/")) {
      const storagePath = audio.url.replace("/api/storage/", "storage/").replace("/storage/", "storage/")
      audioPath = path.join(process.cwd(), storagePath)
    } else {
      audioPath = path.join(process.cwd(), "uploads", path.basename(audio.url))
    }
    
    let jinglePath: string
    if (jingle.fileUrl.startsWith("/uploads/")) {
      jinglePath = path.join(process.cwd(), "uploads", path.basename(jingle.fileUrl))
    } else if (jingle.fileUrl.startsWith("/api/storage/") || jingle.fileUrl.startsWith("/storage/")) {
      const storagePath = jingle.fileUrl.replace("/api/storage/", "storage/").replace("/storage/", "storage/")
      jinglePath = path.join(process.cwd(), storagePath)
    } else {
      jinglePath = path.join(process.cwd(), "uploads", path.basename(jingle.fileUrl))
    }
    
    console.log(`[MIX] File paths: audioPath=${audioPath}, jinglePath=${jinglePath}`)

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
    
    console.log(`[MIX] Durations: audio=${audioDuration}s, jingle=${jingleDuration}s`)

    // Generate output filename - ALWAYS UUID-based, NEVER from metadata
    const outputFilename = `mixed-${randomUUID()}.mp3`
    const outputPath = path.join(process.cwd(), "uploads", outputFilename)
    
    // CRITICAL DEBUG: Log output path
    console.log("[DEBUG] ========== MIX OUTPUT PATH ==========")
    console.log("[DEBUG] FINAL OUTPUT PATH:", outputPath)
    console.log("[DEBUG] Output filename (UUID):", outputFilename)
    console.log("[DEBUG] ====================================")

    // Create ffmpeg command
    return new Promise<NextResponse>((resolve, reject) => {
      try {
        let command = ffmpeg(audioPath)
        const filters: string[] = []
        let inputIndex = 1

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

        const jingleStreams: string[] = []
        
        // For start-end, we need to add the jingle input twice (once for start, once for end)
        // For other positions, we add it once
        if (position === "start-end") {
          // Add jingle input twice
          command = command.input(jinglePath)
          command = command.input(jinglePath)
          
          // Process start position (first input)
          const startDelayMs = Math.round(positions[0] * 1000)
          const startStream = `[${inputIndex}:a]`
          const startDelayed = `[jingle_0_delayed]`
          
          if (volume !== 1.0) {
            filters.push(
              `${startStream}volume=${volume}[jingle_0_volume]`,
              `[jingle_0_volume]adelay=${startDelayMs}|${startDelayMs}${startDelayed}`
            )
          } else {
            filters.push(
              `${startStream}adelay=${startDelayMs}|${startDelayMs}${startDelayed}`
            )
          }
          jingleStreams.push(startDelayed)
          
          // Process end position (second input)
          const endDelayMs = Math.round(positions[1] * 1000)
          const endStream = `[${inputIndex + 1}:a]`
          const endDelayed = `[jingle_1_delayed]`
          
          if (volume !== 1.0) {
            filters.push(
              `${endStream}volume=${volume}[jingle_1_volume]`,
              `[jingle_1_volume]adelay=${endDelayMs}|${endDelayMs}${endDelayed}`
            )
          } else {
            filters.push(
              `${endStream}adelay=${endDelayMs}|${endDelayMs}${endDelayed}`
            )
          }
          jingleStreams.push(endDelayed)
        } else {
          // Single position - add jingle input once
          command = command.input(jinglePath)
          const pos = positions[0]
          const delayMs = Math.round(pos * 1000)
          const jingleStream = `[${inputIndex}:a]`
          const jingleDelayed = `[jingle_0_delayed]`
          
          if (volume !== 1.0) {
            filters.push(
              `${jingleStream}volume=${volume}[jingle_0_volume]`,
              `[jingle_0_volume]adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          } else {
            filters.push(
              `${jingleStream}adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          }
          jingleStreams.push(jingleDelayed)
        }

        // Mix all streams together - use longest duration to preserve full audio
        const mainAudioStream = "[0:a]"
        const allInputs = [mainAudioStream, ...jingleStreams]
        const mixOutput = "[audio_mixed]"
        
        // Build amix filter with proper input syntax
        const amixInputs = allInputs.join("")
        filters.push(
          `${amixInputs}amix=inputs=${allInputs.length}:duration=longest:dropout_transition=0${mixOutput}`
        )
        
        console.log(`[MIX] FFmpeg filters: ${filters.join("; ")}`)
        console.log(`[MIX] Positions: ${positions.join(", ")}s, Jingle streams: ${jingleStreams.length}`)

        // Apply filters and set output
        console.log(`[MIX] Starting FFmpeg processing...`)
        console.log(`[MIX] Output path: ${outputPath}`)
        
        command
          .complexFilter(filters)
          .outputOptions(["-map", mixOutput])
          .outputOptions(["-c:a", "libmp3lame", "-b:a", "192k"])
          .output(outputPath)
          .on("start", (commandLine) => {
            console.log(`[MIX] FFmpeg command: ${commandLine}`)
          })
          .on("progress", (progress) => {
            if (progress.percent) {
              console.log(`[MIX] Processing: ${Math.round(progress.percent)}%`)
            }
          })
          .on("end", async () => {
            console.log(`[MIX] FFmpeg processing completed successfully`)
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

              // Record usage
              await db.usage.record(session.user.id, "mix", {
                audioId: mixedAudio.id,
                parentId: audioId,
                jingleId,
                position,
                volume,
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

