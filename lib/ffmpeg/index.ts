import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import path from "path"
import fs from "fs/promises"
import { tempStorage } from "../storage"

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export interface MixOptions {
  audioUrl: string
  jinglePath?: string
  coverArtPath?: string
  position: "start" | "middle" | "end"
  previewOnly?: boolean
  previewDuration?: number // in seconds
}

export async function mixAudio(options: MixOptions): Promise<string> {
  const { audioUrl, jinglePath, coverArtPath, position, previewOnly = false, previewDuration = 30 } = options

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

  return new Promise((resolve, reject) => {
    let command = ffmpeg(audioPath)

    // Add jingle if provided
    if (jinglePath) {
      if (position === "start") {
        command = command.input(jinglePath).complexFilter([
          "[0:a][1:a]concat=n=2:v=0:a=1[out]"
        ])
      } else if (position === "end") {
        command = command.input(jinglePath).complexFilter([
          "[0:a][1:a]concat=n=2:v=0:a=1[out]"
        ])
      } else {
        // Middle - insert at 50% of audio duration
        // This is simplified - in production, you'd calculate the exact position
        command = command.input(jinglePath).complexFilter([
          "[0:a]atrim=0:50%[a1]",
          "[1:a][a1]concat=n=2:v=0:a=1[out]"
        ])
      }
    }

    // Add cover art if provided
    if (coverArtPath) {
      command = command.input(coverArtPath)
        .outputOptions([
          "-map 0:a",
          "-map 1:v",
          "-c:a copy",
          "-c:v copy",
          "-id3v2_version 3",
        ])
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

