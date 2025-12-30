import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
// @ts-ignore - ffprobe-static doesn't have types
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
      
      // HARD VALIDATION: Verify main audio file exists and is readable
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Main audio file does not exist: ${audioPath}`)
      }
      const mainAudioStats = fs.statSync(audioPath)
      if (mainAudioStats.size === 0) {
        throw new Error(`Main audio file is empty: ${audioPath}`)
      }
      console.log("[FFMPEG] ✅ Main audio validated:", {
        path: audioPath,
        size: mainAudioStats.size,
        exists: true
      })
      
      // Get audio duration
      const audioDuration = await getAudioDuration(audioPath)
      if (audioDuration <= 0) {
        throw new Error(`Invalid audio duration: ${audioDuration} seconds`)
      }
      console.log("[FFMPEG] ✅ Main audio duration:", audioDuration, "seconds")
      
      // HARD VALIDATION: Verify all jingle files exist and are readable
      const validatedJingles: Array<{ config: JingleConfig; duration: number; path: string }> = []
      for (const jingle of jingles) {
        if (!fs.existsSync(jingle.path)) {
          throw new Error(`Jingle file does not exist: ${jingle.path}`)
        }
        const jingleStats = fs.statSync(jingle.path)
        if (jingleStats.size === 0) {
          throw new Error(`Jingle file is empty: ${jingle.path}`)
        }
        const jingleDuration = await getAudioDuration(jingle.path)
        if (jingleDuration <= 0) {
          throw new Error(`Invalid jingle duration: ${jingleDuration} seconds for ${jingle.path}`)
        }
        validatedJingles.push({
          config: jingle,
          duration: jingleDuration,
          path: jingle.path
        })
        console.log("[FFMPEG] ✅ Jingle validated:", {
          path: jingle.path,
          position: jingle.position,
          duration: jingleDuration,
          size: jingleStats.size,
          volume: jingle.volume || 1.0
        })
      }
      
      // Separate jingles by position
      const introJingles = validatedJingles.filter(j => j.config.position === "start")
      const outroJingles = validatedJingles.filter(j => j.config.position === "end")
      const midrollJingles = validatedJingles.filter(j => j.config.position === "middle")
      
      console.log("[FFMPEG] ========== JINGLE PLACEMENT SUMMARY ==========")
      console.log("[FFMPEG] Intro jingles:", introJingles.length)
      console.log("[FFMPEG] Outro jingles:", outroJingles.length)
      console.log("[FFMPEG] Midroll jingles:", midrollJingles.length)
      console.log("[FFMPEG] ============================================")
      
      // Create FFmpeg command
      let command = ffmpeg(audioPath)
      
      // Build concatenation for intro + main + outro
      // FFmpeg concat filter syntax: [0:a][1:a]concat=n=2:v=0:a=1[out]
      // Input order: main audio (0), intro jingles (1+), midroll jingles, outro jingles
      let inputIndex = 1
      const tempFiles: string[] = []
      
      // Add intro jingles as inputs (concatenate before main audio)
      for (const jingle of introJingles) {
        command = command.input(jingle.path)
        inputIndex++
      }
      
      // Add midroll jingles as inputs (will be mixed/overlaid)
      const midrollFilters: string[] = []
      const midrollStartIdx = inputIndex
      if (midrollJingles.length > 0) {
        for (const jingle of midrollJingles) {
          command = command.input(jingle.path)
          const midrollTime = audioDuration / 2
          const delayMs = Math.round(midrollTime * 1000)
          const jingleStream = `[${inputIndex}:a]`
          const jingleDelayed = `[midroll_${inputIndex}_delayed]`
          const volume = jingle.config.volume !== undefined ? jingle.config.volume : 1.0
          
          if (volume !== 1.0) {
            const jingleVolume = `[midroll_${inputIndex}_volume]`
            midrollFilters.push(
              `${jingleStream}volume=${volume}${jingleVolume}`,
              `${jingleVolume}adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          } else {
            midrollFilters.push(
              `${jingleStream}adelay=${delayMs}|${delayMs}${jingleDelayed}`
            )
          }
          inputIndex++
        }
      }
      
      // Add outro jingles as inputs (concatenate after main audio)
      const outroStartIdx = inputIndex
      for (const jingle of outroJingles) {
        command = command.input(jingle.path)
        inputIndex++
      }
      
      // Build filter complex
      const filters: string[] = []
      let finalStream = "[0:a]"
      
      // Handle intro + outro concatenation
      if (introJingles.length > 0 || outroJingles.length > 0) {
        // Build concat input string: [intro1][intro2][main][outro1][outro2]
        const concatInputs: string[] = []
        
        // Add intro jingles (inputs 1, 2, ...)
        for (let i = 0; i < introJingles.length; i++) {
          concatInputs.push(`[${1 + i}:a]`)
        }
        
        // Add main audio (input 0)
        concatInputs.push("[0:a]")
        
        // Add outro jingles (inputs after midroll)
        for (let i = 0; i < outroJingles.length; i++) {
          concatInputs.push(`[${outroStartIdx + i}:a]`)
        }
        
        // Create concat filter: [0:a][1:a]concat=n=2:v=0:a=1[out]
        const concatInputString = concatInputs.join("")
        const concatOutput = "[concat_output]"
        const concatFilter = `${concatInputString}concat=n=${concatInputs.length}:v=0:a=1${concatOutput}`
        
        filters.push(concatFilter)
        finalStream = concatOutput
        
        console.log("[FFMPEG] ✅ Using concat filter with", concatInputs.length, "parts")
        console.log("[FFMPEG] Concat sequence:", 
          introJingles.length > 0 ? `${introJingles.length} intro(s)` : "",
          "main audio",
          outroJingles.length > 0 ? `${outroJingles.length} outro(s)` : ""
        )
      }
      
      // Add midroll mixing if needed (overlay on top of concat/main audio)
      if (midrollJingles.length > 0) {
        // Apply midroll filters
        filters.push(...midrollFilters)
        
        // Mix midroll jingles with the main/concat audio
        const midrollInputs = midrollJingles.map((_, idx) => `[midroll_${midrollStartIdx + idx}_delayed]`)
        const mixInputs = [finalStream, ...midrollInputs]
        const mixOutput = "[final_mixed]"
        
        filters.push(
          `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=0${mixOutput}`
        )
        finalStream = mixOutput
        console.log("[FFMPEG] ✅ Adding midroll mixing with", midrollInputs.length, "jingle(s)")
      }
      
      // Apply filters if any
      if (filters.length > 0) {
        command = command.complexFilter(filters)
        // CRITICAL: Map the filter output stream
        command = command.outputOptions(["-map", finalStream])
        console.log("[FFMPEG] ✅ Applied", filters.length, "filter(s)")
        console.log("[FFMPEG] Filter complex:", filters.join("; "))
        console.log("[FFMPEG] ✅ Mapping filter output:", finalStream)
      } else {
        // No jingles, just use original audio
        command = command.outputOptions(["-map", "0:a"])
        console.log("[FFMPEG] No jingles, using original audio")
      }

      // CRITICAL: Do NOT add cover art or metadata during mixing
      // Cover art and metadata are applied AFTER mixing using node-id3
      // Just audio encoding, no metadata
      command = command.outputOptions([
        "-c:a", "libmp3lame",
        "-b:a", "192k",
      ])

      // CRITICAL: Do NOT apply metadata during mixing
      // Metadata is applied AFTER mixing using node-id3 for reliability
      // Only log if metadata was provided (should be undefined for mixing)
      if (metadata) {
        console.log("[FFMPEG] WARNING: Metadata provided to mixAudio - will be ignored (metadata applied after mixing)")
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
          console.log("[FFMPEG] ========== EXACT FFMPEG COMMAND ==========")
          console.log("[FFMPEG] COMMAND:", commandLine)
          console.log("[FFMPEG] OUTPUT PATH:", absoluteOutputPath)
          console.log("[FFMPEG] MAIN AUDIO:", audioPath)
          console.log("[FFMPEG] JINGLES:", jingles.length)
          
          const allInputs = [audioPath, ...jingles.map(j => j.path)]
          console.log("[FFMPEG] FINAL FFMPEG INPUTS:", allInputs.length)
          console.log("[FFMPEG]   Input 0 (main):", audioPath)
          jingles.forEach((j, i) => {
            console.log(`[FFMPEG]   Input ${i + 1} (jingle): ${j.path} (position: ${j.position})`)
          })
          
          if (filters.length > 0) {
            console.log("[FFMPEG] FILTER OUTPUT STREAM:", finalStream)
            console.log("[FFMPEG] VERIFYING -map flag includes:", finalStream)
            if (!commandLine.includes(`-map ${finalStream}`) && !commandLine.includes(`-map "${finalStream}"`)) {
              console.error("[FFMPEG] ❌ ERROR: -map flag missing for filter output!")
              console.error("[FFMPEG] Command should include: -map", finalStream)
            } else {
              console.log("[FFMPEG] ✅ -map flag correctly includes filter output")
            }
          }
          console.log("[FFMPEG] =========================================")
        })
        .on("stderr", (stderrLine) => {
          // Log FFmpeg stderr for debugging
          if (stderrLine.includes("error") || stderrLine.includes("Error") || stderrLine.includes("ERROR")) {
            console.error("[FFMPEG] STDERR:", stderrLine)
          } else if (stderrLine.includes("Duration") || stderrLine.includes("time=")) {
            // Log duration/time info
            console.log("[FFMPEG] STDERR:", stderrLine)
          }
        })
        .on("end", async () => {
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
          
          console.log("[FFMPEG] ========== OUTPUT FILE VERIFICATION ==========")
          console.log("[FFMPEG] FILE PATH:", absoluteOutputPath)
          console.log("[FFMPEG] FILE SIZE:", stats.size, "bytes")
          
          // Get output duration
          let outputDuration: number
          try {
            outputDuration = await getAudioDuration(absoluteOutputPath)
            console.log("[FFMPEG] FINAL OUTPUT DURATION:", outputDuration, "seconds")
            console.log("[FFMPEG] INPUT DURATION:", audioDuration, "seconds")
          } catch (durationError: any) {
            reject(new Error(`Failed to get output duration: ${durationError.message}`))
            return
          }
          
          // HARD FAIL: If jingle is resolved, output duration MUST be different
          if (jingles.length > 0) {
            const hasIntro = jingles.some(j => j.position === "start")
            const hasOutro = jingles.some(j => j.position === "end")
            
            if (hasIntro || hasOutro) {
              const expectedDurationIncrease = jingles
                .filter(j => j.position === "start" || j.position === "end")
                .reduce((sum, j) => {
                  const jingleDuration = validatedJingles.find(vj => vj.config === j)?.duration || 0
                  return sum + jingleDuration
                }, 0)
              
              const expectedDuration = audioDuration + expectedDurationIncrease
              const durationDiff = Math.abs(outputDuration - expectedDuration)
              
              console.log("[FFMPEG] EXPECTED DURATION:", expectedDuration, "seconds")
              console.log("[FFMPEG] ACTUAL DURATION:", outputDuration, "seconds")
              console.log("[FFMPEG] DURATION DIFF:", durationDiff, "seconds")
              
              // HARD FAIL: Output duration must be longer than input for intro/outro
              if (outputDuration <= audioDuration) {
                const errorMsg = `JINGLE RESOLVED BUT FINAL OUTPUT DOES NOT CONTAIN IT. Input: ${audioDuration}s, Output: ${outputDuration}s. Expected: ${expectedDuration}s`
                console.error("[FFMPEG] ❌", errorMsg)
                reject(new Error(errorMsg))
                return
              }
              
              // Allow 1 second tolerance for encoding
              if (durationDiff > 1.0) {
                const errorMsg = `JINGLE RESOLVED BUT DURATION MISMATCH. Expected: ${expectedDuration}s, Got: ${outputDuration}s, Diff: ${durationDiff}s`
                console.error("[FFMPEG] ❌", errorMsg)
                reject(new Error(errorMsg))
                return
              }
            }
          }
          
          console.log("[FFMPEG] ✅ OUTPUT VERIFICATION PASSED")
          console.log("[FFMPEG] ===========================================")
          
          // Clean up temp files
          for (const tempFile of tempFiles) {
            try {
              if (fs.existsSync(tempFile)) {
                await fsPromises.unlink(tempFile)
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
          }
          
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

