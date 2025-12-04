/**
 * YouTube downloader using local yt-dlp binary
 * Robust, modern solution that handles YouTube's signature changes automatically
 * Uses local binary in project/bin/yt-dlp (auto-downloaded if missing)
 */

import { promises as fs } from "fs"
import * as path from "path"
import { randomUUID } from "crypto"
import { ensureYtDlpBinary } from "./ytDlpBinary"

let ytDlpInstance: any = null

/**
 * Get or initialize yt-dlp instance with local binary
 */
async function getYtDlp(): Promise<any> {
  if (!ytDlpInstance) {
    try {
      // Ensure local binary exists
      const binPath = await ensureYtDlpBinary()
      
      // Import yt-dlp-wrap - handle CommonJS default export
      const YTDlpWrapModule = require("yt-dlp-wrap")
      const YTDlpWrap = YTDlpWrapModule.default || YTDlpWrapModule
      
      // Create instance with explicit binary path
      ytDlpInstance = new YTDlpWrap(binPath)
      
      // Verify binary works
      try {
        const version = await ytDlpInstance.getVersion()
        console.log("[YOUTUBE] yt-dlp binary ready, version:", version)
      } catch (error: any) {
        console.error("[YOUTUBE] Binary verification failed:", error.message)
        throw new Error(`yt-dlp binary verification failed: ${error.message}`)
      }
    } catch (error: any) {
      console.error("[YOUTUBE] Failed to initialize yt-dlp:", error.message)
      throw new Error(`Failed to initialize yt-dlp: ${error.message}`)
    }
  }
  return ytDlpInstance
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^https?:\/\/m\.youtube\.com\/.+/,
    /^https?:\/\/youtube\.com\/.+/,
  ]
  return patterns.some((pattern) => pattern.test(url))
}

export interface YouTubeDownloadResult {
  buffer: Buffer
  title: string
  artist?: string
  thumbnail?: string
  duration?: number
  metadata: {
    id: string
    uploader?: string
    description?: string
    viewCount?: number
  }
}

/**
 * Download audio from YouTube URL
 * Uses local yt-dlp binary with comprehensive fallbacks
 */
export async function downloadYouTubeAudio(url: string): Promise<YouTubeDownloadResult> {
  if (!isValidYouTubeUrl(url)) {
    throw new Error("Invalid YouTube URL")
  }

  const ytDlp = await getYtDlp()
  const tempDir = path.join(process.cwd(), "tmp", "youtube")
  await fs.mkdir(tempDir, { recursive: true })

  const fileId = randomUUID()
  const outputPath = path.join(tempDir, `${fileId}.%(ext)s`)

  // First, get video info as JSON with multiple fallback strategies
  let videoInfo: any
  const infoAttempts = [
    // Attempt 1: Standard web client
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=web",
    ],
    // Attempt 2: Android client (more stable)
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=android",
    ],
    // Attempt 3: iOS client
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=ios",
    ],
    // Attempt 4: TV client
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=tv_embedded",
    ],
  ]

  let lastError: Error | null = null
  for (let i = 0; i < infoAttempts.length; i++) {
    try {
      console.log(`[YOUTUBE] Fetching video info (attempt ${i + 1}/${infoAttempts.length})...`)
      const infoOutput = await ytDlp.execPromise(infoAttempts[i])
      const infoText = infoOutput.toString().trim()
      
      // Handle case where output might have extra lines or warnings
      const lines = infoText.split('\n')
      const jsonLine = lines.find((line: string) => {
        const trimmed = line.trim()
        return trimmed.startsWith('{') && trimmed.endsWith('}')
      }) || lines[lines.length - 1]
      
      if (!jsonLine || !jsonLine.trim().startsWith('{')) {
        throw new Error("Invalid JSON response from yt-dlp")
      }
      
      videoInfo = JSON.parse(jsonLine.trim())
      console.log("[YOUTUBE] Video info retrieved:", {
        id: videoInfo.id,
        title: videoInfo.title,
        duration: videoInfo.duration,
      })
      break // Success, exit loop
    } catch (error: any) {
      console.warn(`[YOUTUBE] Info attempt ${i + 1} failed:`, error.message)
      lastError = error
      if (i === infoAttempts.length - 1) {
        // Last attempt failed
        throw new Error(`Failed to get video info after ${infoAttempts.length} attempts: ${lastError.message}`)
      }
    }
  }

  if (!videoInfo) {
    throw new Error("Failed to retrieve video info")
  }

  // Download audio with best quality - multiple fallback strategies
  const downloadAttempts = [
    // Attempt 1: Best audio format with web client
    [
      url,
      "-f", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=web",
      "--output", outputPath,
      "--quiet",
      "--no-progress",
    ],
    // Attempt 2: Best audio with android client + compat options
    [
      url,
      "-f", "bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "--compat-options", "no-youtube-unavailable-videos",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=android",
      "--output", outputPath,
      "--quiet",
      "--no-progress",
    ],
    // Attempt 3: iOS client
    [
      url,
      "-f", "bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "--extractor-args", "youtube:player_client=ios",
      "--no-check-certificate",
      "--force-ipv4",
      "--output", outputPath,
      "--quiet",
      "--no-progress",
    ],
    // Attempt 4: TV client
    [
      url,
      "-f", "bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "--extractor-args", "youtube:player_client=tv_embedded",
      "--no-check-certificate",
      "--force-ipv4",
      "--output", outputPath,
      "--quiet",
      "--no-progress",
    ],
    // Attempt 5: Any format, let ffmpeg handle conversion
    [
      url,
      "-f", "best[height<=720]/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--output", outputPath,
      "--quiet",
      "--no-progress",
    ],
  ]

  let downloadError: Error | null = null
  for (let i = 0; i < downloadAttempts.length; i++) {
    try {
      console.log(`[YOUTUBE] Downloading audio (attempt ${i + 1}/${downloadAttempts.length})...`)
      await ytDlp.execPromise(downloadAttempts[i])

      // Find the downloaded file
      const files = await fs.readdir(tempDir)
      const baseName = fileId
      const downloadedFile = files.find((f) => {
        return f.startsWith(baseName) && (f.endsWith(".mp3") || f.endsWith(".m4a") || f.endsWith(".webm") || f.endsWith(".opus") || f.endsWith(".ogg"))
      })

      if (!downloadedFile) {
        // List all files for debugging
        console.error("[YOUTUBE] Available files in temp dir:", files)
        console.error("[YOUTUBE] Looking for file starting with:", baseName)
        throw new Error(`Downloaded file not found. Expected file starting with "${baseName}"`)
      }

      const filePath = path.join(tempDir, downloadedFile)
      const buffer = await fs.readFile(filePath)

      // Clean up temp file
      await fs.unlink(filePath).catch(() => {})

      console.log("[YOUTUBE] Download successful:", {
        size: buffer.length,
        title: videoInfo.title,
        attempt: i + 1,
      })

      return {
        buffer,
        title: videoInfo.title || "Untitled",
        artist: videoInfo.uploader || videoInfo.channel || undefined,
        thumbnail: videoInfo.thumbnail || videoInfo.thumbnails?.[videoInfo.thumbnails.length - 1]?.url,
        duration: videoInfo.duration ? Math.round(videoInfo.duration) : undefined,
        metadata: {
          id: videoInfo.id,
          uploader: videoInfo.uploader,
          description: videoInfo.description,
          viewCount: videoInfo.view_count,
        },
      }
    } catch (error: any) {
      console.warn(`[YOUTUBE] Download attempt ${i + 1} failed:`, error.message)
      downloadError = error
      
      // Clean up any partial files
      try {
        const files = await fs.readdir(tempDir)
        for (const file of files) {
          if (file.startsWith(fileId)) {
            await fs.unlink(path.join(tempDir, file)).catch(() => {})
          }
        }
      } catch {}

      if (i === downloadAttempts.length - 1) {
        // Last attempt failed
        throw new Error(`Failed to download YouTube audio after ${downloadAttempts.length} attempts: ${downloadError.message}`)
      }
    }
  }

  throw new Error("Download failed - no attempts succeeded")
}

/**
 * Get YouTube video info without downloading
 */
export async function getYouTubeInfo(url: string): Promise<{
  title: string
  artist?: string
  thumbnail?: string
  duration?: number
  id: string
}> {
  if (!isValidYouTubeUrl(url)) {
    throw new Error("Invalid YouTube URL")
  }

  const ytDlp = await getYtDlp()

  const infoAttempts = [
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=web",
    ],
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=android",
    ],
    [
      url,
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--force-ipv4",
      "--extractor-args", "youtube:player_client=ios",
    ],
  ]

  for (const args of infoAttempts) {
    try {
      const infoOutput = await ytDlp.execPromise(args)
      const infoText = infoOutput.toString().trim()
      const lines = infoText.split('\n')
      const jsonLine = lines.find((line: string) => {
        const trimmed = line.trim()
        return trimmed.startsWith('{') && trimmed.endsWith('}')
      }) || lines[lines.length - 1]
      
      if (!jsonLine || !jsonLine.trim().startsWith('{')) {
        throw new Error("Invalid JSON response from yt-dlp")
      }
      
      const videoInfo = JSON.parse(jsonLine.trim())

      return {
        title: videoInfo.title || "Untitled",
        artist: videoInfo.uploader || videoInfo.channel,
        thumbnail: videoInfo.thumbnail || videoInfo.thumbnails?.[videoInfo.thumbnails.length - 1]?.url,
        duration: videoInfo.duration ? Math.round(videoInfo.duration) : undefined,
        id: videoInfo.id,
      }
    } catch (error: any) {
      // Try next attempt
      continue
    }
  }

  throw new Error("Failed to get YouTube info after all attempts")
}
