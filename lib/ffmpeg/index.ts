import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import path from "path"
import fs from "fs/promises"
import { tempStorage } from "../storage"

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export interface JingleConfig {
  path: string
  position: "start" | "middle" | "end"
  volume?: number // 0.0 to 1.0, default 1.0
}

export interface MixOptions {
  audioUrl: string
  jingles?: JingleConfig[] // Array of jingles (max 1 for free, max 3 for pro)
  coverArtPath?: string
  previewOnly?: boolean
  previewDuration?: number // in seconds
  metadata?: {
    title?: string
    artist?: string
    album?: string
    genre?: string
  }
}

export async function mixAudio(options: MixOptions): Promise<string> {
  const { audioUrl, jingles = [], coverArtPath, previewOnly = false, previewDuration = 30, metadata } = options

  // Download audio file if it's a URL
  let audioPath: string
  if (audioUrl.startsWith("http")) {
    const response = await fetch(audioUrl)
    const buffer = await response.arrayBuffer()
    const filename = `audio_${Date.now()}.mp3`
    audioPath = await tempStorage.save(Buffer.from(buffer), filename)
  } else {
    audioPath = audioUrl
  }

  const outputFilename = `mix_${Date.now()}.mp3`
  const outputPath = previewOnly
    ? await tempStorage.getPath(outputFilename)
    : path.join(process.cwd(), "tmp", "gispal", outputFilename)

  return new Promise(async (resolve, reject) => {
    try {
      // Get audio duration
      const audioDuration = await getAudioDuration(audioPath)
      
      let command = ffmpeg(audioPath)
      const filters: string[] = []
      let currentAudioStream = "[0:a]"
      let inputIndex = 1

      // Process each jingle
      if (jingles.length > 0) {
        for (const jingle of jingles) {
          const jingleDuration = await getAudioDuration(jingle.path)
          let jingleStartTime = 0

          // Calculate jingle start time based on position
          if (jingle.position === "start") {
            jingleStartTime = 0
          } else if (jingle.position === "middle") {
            jingleStartTime = (audioDuration - jingleDuration) / 2
          } else if (jingle.position === "end") {
            jingleStartTime = Math.max(0, audioDuration - jingleDuration)
          }

          // Add jingle as input
          command = command.input(jingle.path)
          
          // Apply volume if specified (volume filter: 0.0 to 1.0)
          const volume = jingle.volume !== undefined ? jingle.volume : 1.0
          
          // Delay the jingle to start at the correct position
          const delayMs = Math.round(jingleStartTime * 1000)
          const jingleStream = `[${inputIndex}:a]`
          const jingleDelayed = `[jingle_${inputIndex}_delayed]`
          
          if (volume !== 1.0) {
            // Apply volume first, then delay
            const jingleVolume = `[jingle_${inputIndex}_volume]`
            filters.push(
              `${jingleStream}volume=${volume}${jingleVolume}`,
              `${jingleVolume}adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          } else {
            // Just delay
            filters.push(
              `${jingleStream}adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          }
          
          inputIndex++
        }

        // Mix all jingles with the main audio
        // Build amix inputs: main audio + all delayed jingles
        const mixInputs = [currentAudioStream, ...jingles.map((_, idx) => `[jingle_${idx + 1}_delayed]`)]
        const mixOutput = "[audio_mixed]"
        
        filters.push(
          `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0${mixOutput}`
        )
        
        currentAudioStream = mixOutput
        command = command.complexFilter(filters)
        command = command.outputOptions(["-map", currentAudioStream])
      } else {
        // No jingles, just use original audio
        command = command.outputOptions(["-map", "0:a"])
      }

      // Add cover art if provided (as metadata)
      if (coverArtPath) {
        command = command.input(coverArtPath)
        const coverArtIndex = inputIndex
        
        command = command.outputOptions([
          "-map", currentAudioStream,
          "-map", `${coverArtIndex}:v?`,
          "-c:a", "libmp3lame",
          "-b:a", "192k",
          "-c:v", "copy",
          "-id3v2_version", "3",
          "-write_id3v1", "1",
        ])
      } else {
        // Just audio, no cover art
        command = command.outputOptions([
          "-c:a", "libmp3lame",
          "-b:a", "192k",
        ])
      }

      // Add metadata if provided
      if (metadata) {
        if (metadata.title) {
          command = command.outputOptions(["-metadata", `title=${metadata.title}`])
        }
        if (metadata.artist) {
          command = command.outputOptions(["-metadata", `artist=${metadata.artist}`])
        }
        if (metadata.album) {
          command = command.outputOptions(["-metadata", `album=${metadata.album}`])
        }
        if (metadata.genre) {
          command = command.outputOptions(["-metadata", `genre=${metadata.genre}`])
        }
      }

      // Limit duration for preview
      if (previewOnly) {
        command = command.duration(previewDuration)
      }

      command
        .output(outputPath)
        .on("end", () => {
          resolve(outputPath)
        })
        .on("error", (err) => {
          reject(err)
        })
        .run()
    } catch (error) {
      reject(error)
    }
  })
}

export async function extractCoverArt(audioPath: string): Promise<string | null> {
  const outputPath = await tempStorage.getPath(`cover_${Date.now()}.jpg`)

  return new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .outputOptions(["-an", "-vcodec", "copy"])
      .output(outputPath)
      .on("end", () => {
        resolve(outputPath)
      })
      .on("error", (err) => {
        // Cover art might not exist
        resolve(null)
      })
      .run()
  })
}

export async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      resolve(metadata.format.duration || 0)
    })
  })
}

