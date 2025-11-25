import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import ffprobeStatic from "ffprobe-static"
import path from "path"
import fs from "fs"
import { promises as fsPromises } from "fs"
import { tempStorage } from "../storage"

// Configure ffmpeg and ffprobe paths with fallback logic
let ffmpegPath: string | null = null
let ffprobePath: string | null = null

// Helper to resolve absolute path and verify file exists (synchronous)
function resolveAndVerifyBinary(binaryPath: string | null): string | null {
  if (!binaryPath) return null
  
  try {
    // Resolve to absolute path - handle both absolute and relative paths
    let absolutePath: string
    if (path.isAbsolute(binaryPath)) {
      absolutePath = binaryPath
    } else {
      // If relative, resolve from process.cwd() or from node_modules
      absolutePath = path.resolve(process.cwd(), binaryPath)
      
      // If that doesn't exist, try resolving from node_modules
      if (!fs.existsSync(absolutePath)) {
        const nodeModulesPath = path.resolve(process.cwd(), "node_modules", binaryPath)
        if (fs.existsSync(nodeModulesPath)) {
          absolutePath = nodeModulesPath
        }
      }
    }
    
    // Verify file exists
    if (fs.existsSync(absolutePath)) {
      return absolutePath
    }
    
    return null
  } catch (error) {
    console.error(`[FFMPEG] Error resolving binary path ${binaryPath}:`, error)
    return null
  }
}

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpegPath = resolveAndVerifyBinary(ffmpegStatic)
  
  if (ffmpegPath) {
    try {
      ffmpeg.setFfmpegPath(ffmpegPath)
    } catch (error) {
      console.error("[FFMPEG] Failed to set ffmpeg path:", error)
      ffmpegPath = null
    }
  }
  
  // Fallback to system ffmpeg if static binary not found
  if (!ffmpegPath) {
    const systemFfmpeg = "/usr/bin/ffmpeg"
    if (fs.existsSync(systemFfmpeg)) {
      ffmpegPath = systemFfmpeg
      try {
        ffmpeg.setFfmpegPath(ffmpegPath)
      } catch (error) {
        console.error("[FFMPEG] Failed to set system ffmpeg path:", error)
      }
    }
  }
} else {
  // Fallback to system ffmpeg
  const systemFfmpeg = "/usr/bin/ffmpeg"
  if (fs.existsSync(systemFfmpeg)) {
    ffmpegPath = systemFfmpeg
    try {
      ffmpeg.setFfmpegPath(ffmpegPath)
    } catch (error) {
      console.error("[FFMPEG] Failed to set ffmpeg path:", error)
    }
  }
}

// Set ffprobe path
if (ffprobeStatic) {
  // ffprobe-static exports an object with a path property
  const rawPath = (ffprobeStatic as any).path || ffprobeStatic
  
  if (rawPath) {
    // Always resolve to absolute path, even if it's already absolute
    // This ensures Next.js bundling doesn't break the path
    let absolutePath: string
    if (path.isAbsolute(rawPath)) {
      absolutePath = rawPath
    } else {
      // Try resolving from node_modules first (most common case)
      absolutePath = path.resolve(process.cwd(), "node_modules", "ffprobe-static", rawPath)
      if (!fs.existsSync(absolutePath)) {
        // Fallback to resolving from cwd
        absolutePath = path.resolve(process.cwd(), rawPath)
      }
    }
    
    // Verify the resolved path exists
    if (fs.existsSync(absolutePath)) {
      ffprobePath = absolutePath
      try {
        ffmpeg.setFfprobePath(ffprobePath)
        // Log in development to verify
        if (process.env.NODE_ENV === "development") {
          console.log("[FFMPEG] FFprobe configured at:", ffprobePath)
        }
      } catch (error) {
        console.error("[FFMPEG] Failed to set ffprobe path:", error)
        ffprobePath = null
      }
    } else {
      console.error(`[FFMPEG] FFprobe binary not found at resolved path: ${absolutePath}`)
      console.error(`[FFMPEG] Raw path was: ${rawPath}`)
      console.error(`[FFMPEG] Process cwd: ${process.cwd()}`)
      ffprobePath = null
    }
    
    // Fallback to system ffprobe if static binary not found
    if (!ffprobePath) {
      const systemFfprobe = "/usr/bin/ffprobe"
      if (fs.existsSync(systemFfprobe)) {
        ffprobePath = systemFfprobe
        try {
          ffmpeg.setFfprobePath(ffprobePath)
          console.log("[FFMPEG] Using system ffprobe at:", ffprobePath)
        } catch (error) {
          console.error("[FFMPEG] Failed to set system ffprobe path:", error)
        }
      } else {
        console.error("[FFMPEG] System ffprobe not found at /usr/bin/ffprobe")
      }
    }
  }
} else {
  // Fallback to system ffprobe
  const systemFfprobe = "/usr/bin/ffprobe"
  if (fs.existsSync(systemFfprobe)) {
    ffprobePath = systemFfprobe
    try {
      ffmpeg.setFfprobePath(ffprobePath)
    } catch (error) {
      console.error("[FFMPEG] Failed to set ffprobe path:", error)
    }
  }
}

// Runtime initialization function to ensure paths are set correctly
// This can be called from API routes if module-level initialization fails
export function initializeFfmpegPaths() {
  // Re-initialize if paths are not set
  if (!ffmpegPath && ffmpegStatic) {
    const resolved = resolveAndVerifyBinary(ffmpegStatic)
    if (resolved) {
      ffmpegPath = resolved
      ffmpeg.setFfmpegPath(ffmpegPath)
    }
  }
  
  if (!ffprobePath && ffprobeStatic) {
    const rawPath = (ffprobeStatic as any).path || ffprobeStatic
    if (rawPath) {
      let absolutePath: string
      if (path.isAbsolute(rawPath)) {
        absolutePath = rawPath
      } else {
        absolutePath = path.resolve(process.cwd(), "node_modules", "ffprobe-static", rawPath)
        if (!fs.existsSync(absolutePath)) {
          absolutePath = path.resolve(process.cwd(), rawPath)
        }
      }
      
      if (fs.existsSync(absolutePath)) {
        ffprobePath = absolutePath
        ffmpeg.setFfprobePath(ffprobePath)
      }
    }
  }
  
  return {
    ffmpegPath,
    ffprobePath,
  }
}

// Log paths in development (wrapped to prevent SSR spam)
if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  console.log("[FFMPEG] FFMPEG PATH:", ffmpegPath)
  console.log("[FFMPEG] FFPROBE PATH:", ffprobePath)
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
  outputPath?: string // Optional explicit output path (if not provided, uses tmp/gispal)
  metadata?: {
    title?: string
    artist?: string
    album?: string
    genre?: string
  }
}

export async function mixAudio(options: MixOptions): Promise<string> {
  const { audioUrl, jingles = [], coverArtPath, previewOnly = false, previewDuration = 30, outputPath: providedOutputPath, metadata } = options

  // Download audio file if it's a URL
  let audioPath: string
  if (audioUrl.startsWith("http")) {
    const response = await fetch(audioUrl)
    const buffer = await response.arrayBuffer()
    const filename = `audio_${Date.now()}.mp3`
    audioPath = await tempStorage.save(Buffer.from(buffer), filename)
  } else {
    // Ensure input path is absolute
    audioPath = path.isAbsolute(audioUrl) ? audioUrl : path.resolve(process.cwd(), audioUrl)
  }

  // Use provided output path or generate one in tmp/gispal
  let absoluteOutputPath: string
  if (providedOutputPath) {
    // Use provided output path - ensure it's absolute
    absoluteOutputPath = path.isAbsolute(providedOutputPath) 
      ? providedOutputPath 
      : path.join(process.cwd(), providedOutputPath)
    
    // Ensure output directory exists
    const outputDir = path.dirname(absoluteOutputPath)
    if (!fs.existsSync(outputDir)) {
      console.log("[FS] Creating directory:", outputDir)
      fs.mkdirSync(outputDir, { recursive: true })
    } else {
      console.log("[FS] Directory exists:", outputDir)
    }
  } else {
    // Generate output path in tmp/gispal for previews
    const outputFilename = `mixed-${Date.now()}.mp3`
    const outputDir = path.join(process.cwd(), "tmp", "gispal")
    if (!fs.existsSync(outputDir)) {
      console.log("[FS] Creating directory:", outputDir)
      fs.mkdirSync(outputDir, { recursive: true })
    } else {
      console.log("[FS] Directory exists:", outputDir)
    }
    absoluteOutputPath = path.join(outputDir, outputFilename)
  }

  // Validate output path
  if (!absoluteOutputPath.endsWith(".mp3")) {
    throw new Error(`Invalid output path: ${absoluteOutputPath} (must end with .mp3)`)
  }
  
  const outputFilename = path.basename(absoluteOutputPath)
  
  console.log("[FFMPEG] ========== MIXING AUDIO ==========")
  console.log("[FFMPEG] INPUT AUDIO:", audioPath)
  if (jingles.length > 0) {
    jingles.forEach((j, idx) => {
      console.log(`[FFMPEG] JINGLE ${idx + 1}:`, j.path)
    })
  }
  console.log("[FFMPEG] OUTPUT FILE:", absoluteOutputPath)

  return new Promise(async (resolve, reject) => {
    try {
      // Initialize FFmpeg paths
      initializeFfmpegPaths()
      
      // Get audio duration
      const audioDuration = await getAudioDuration(audioPath)
      
      // Create FFmpeg command
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
          `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=0${mixOutput}`
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
      // CRITICAL: Metadata values are ONLY for ID3 tags, NEVER for filenames
      // Use proper escaping to prevent FFmpeg from misinterpreting metadata as filenames
      if (metadata) {
        if (metadata.title) {
          // Sanitize title - replace ALL spaces and special chars with underscores
          // This prevents FFmpeg from misinterpreting "Seyi Vibez" as separate arguments
          const sanitizedTitle = metadata.title.replace(/[=:"'\s]/g, "_").trim()
          // Use separate -metadata flag with key=value format
          command = command.outputOptions(["-metadata", `title=${sanitizedTitle}`])
        }
        if (metadata.artist) {
          // Sanitize artist - replace ALL spaces to prevent "Seyi Vibez" from being split
          const sanitizedArtist = metadata.artist.replace(/[=:"'\s]/g, "_").trim()
          command = command.outputOptions(["-metadata", `artist=${sanitizedArtist}`])
        }
        if (metadata.album) {
          const sanitizedAlbum = metadata.album.replace(/[=:"'\s]/g, "_").trim()
          command = command.outputOptions(["-metadata", `album=${sanitizedAlbum}`])
        }
        if (metadata.genre) {
          const sanitizedGenre = metadata.genre.replace(/[=:"'\s]/g, "_").trim()
          command = command.outputOptions(["-metadata", `genre=${sanitizedGenre}`])
        }
      }
      
      // CRITICAL: Output path is set AFTER metadata to ensure it's never overridden

      // Limit duration for preview
      if (previewOnly) {
        command = command.duration(previewDuration)
      }

      // CRITICAL: Set output path LAST and explicitly
      // Use -y flag to overwrite, then set output path
      command = command.outputOptions(["-y"])
      
      // CRITICAL DEBUG: Log output path before setting it
      console.log("[DEBUG] ========== FFMPEG OUTPUT PATH ==========")
      console.log("[DEBUG] FINAL OUTPUT PATH:", absoluteOutputPath)
      console.log("[DEBUG] Output filename:", outputFilename)
      console.log("[DEBUG] =========================================")
      
      // Set output using the output() method - this MUST be the last call
      // before run() to ensure FFmpeg uses this as the output file
      // NEVER use metadata values for output path - ALWAYS use UUID-based filename
      command = command.output(absoluteOutputPath)
      
      // Verify the output path is valid before running
      if (!absoluteOutputPath || !absoluteOutputPath.endsWith(".mp3")) {
        throw new Error(`Invalid output path: ${absoluteOutputPath}`)
      }
      
      // Double-check: Ensure output path contains UUID, not metadata
      if (!absoluteOutputPath.includes("final-") && !absoluteOutputPath.includes("mixed-")) {
        console.error("[DEBUG] WARNING: Output path does not contain UUID pattern!")
        console.error("[DEBUG] Output path:", absoluteOutputPath)
      }
      
      // Add event handlers
      command
        .on("start", (commandLine) => {
          console.log("[FFMPEG] ========== FFMPEG COMMAND START ==========")
          console.log("[FFMPEG] Full command:", commandLine)
          console.log("[FFMPEG] Expected output path:", absoluteOutputPath)
          console.log("[FFMPEG] Expected output filename:", outputFilename)
          
          // Extract the actual output file from the command
          const outputMatch = commandLine.match(/(?:-y\s+)?([^\s]+\.mp3)(?:\s|$)/)
          if (outputMatch) {
            console.log("[FFMPEG] Detected output in command:", outputMatch[1])
            if (outputMatch[1] !== absoluteOutputPath && outputMatch[1] !== outputFilename && !outputMatch[1].includes(outputFilename)) {
              console.error("[FFMPEG] ERROR: Output mismatch! Expected:", absoluteOutputPath, "Got:", outputMatch[1])
            }
          } else {
            console.warn("[FFMPEG] WARNING: Could not detect output file in command!")
          }
          console.log("[FFMPEG] ==========================================")
        })
        .on("end", () => {
          // Validate output file exists
          if (!fs.existsSync(absoluteOutputPath)) {
            reject(new Error(`Output file missing after FFmpeg processing: ${absoluteOutputPath}`))
            return
          }
          
          // Validate file is not empty
          const stats = fs.statSync(absoluteOutputPath)
          if (stats.size === 0) {
            reject(new Error(`Output file is empty: ${absoluteOutputPath}`))
            return
          }
          
          console.log("[FFMPEG] Mix completed successfully:", absoluteOutputPath)
          console.log("[FFMPEG] Output file size:", stats.size, "bytes")
          resolve(absoluteOutputPath)
        })
        .on("error", (err) => {
          console.error("[FFMPEG] Mix error:", err.message)
          console.error("[FFMPEG] Output path was:", absoluteOutputPath)
          console.error("[FFMPEG] Output filename:", outputFilename)
          console.error("[FFMPEG] Full error:", err)
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
  // Ensure paths are initialized before using ffprobe
  initializeFfmpegPaths()
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        // Provide clearer error message
        const errorMessage = err.message || "Unknown error"
        if (errorMessage.includes("ffprobe") || errorMessage.includes("Cannot find") || errorMessage.includes("ENOENT")) {
          // Try to re-initialize and retry once
          const paths = initializeFfmpegPaths()
          if (paths.ffprobePath) {
            // Retry with re-initialized path
            ffmpeg.ffprobe(audioPath, (retryErr, retryMetadata) => {
              if (retryErr) {
                reject(new Error(`FFprobe not found. Path configured: ${paths.ffprobePath}. Original error: ${errorMessage}`))
              } else if (!retryMetadata || !retryMetadata.format) {
                reject(new Error("Invalid audio file or metadata not found"))
              } else {
                resolve(retryMetadata.format.duration || 0)
              }
            })
          } else {
            reject(new Error(`FFprobe not found. Please ensure ffprobe-static is installed and configured. Original error: ${errorMessage}`))
          }
        } else {
          reject(new Error(`Failed to get audio duration: ${errorMessage}`))
        }
        return
      }
      if (!metadata || !metadata.format) {
        reject(new Error("Invalid audio file or metadata not found"))
        return
      }
      resolve(metadata.format.duration || 0)
    })
  })
}

