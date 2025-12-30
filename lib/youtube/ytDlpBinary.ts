/**
 * Local yt-dlp binary management
 * Automatically downloads and manages yt-dlp binary in project/bin directory
 * No dependency on system PATH, brew, or pip
 * Always downloads standalone executable (not Python script)
 */

import { existsSync, mkdirSync, chmodSync, unlink } from "fs"
import * as path from "path"
import * as https from "https"
import { createWriteStream } from "fs"

const binDir = path.resolve(process.cwd(), "bin")
const binPath = path.join(binDir, "yt-dlp")

/**
 * Download yt-dlp binary directly from GitHub releases
 * Downloads platform-specific standalone executable
 */
async function downloadBinaryFromGitHub(targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine platform-specific binary name
    const platform = process.platform
    const arch = process.arch
    let binaryName = "yt-dlp"
    
    if (platform === "win32") {
      binaryName = "yt-dlp.exe"
    } else if (platform === "darwin") {
      // macOS: Use standalone executable (not Python script)
      // The standalone binary works on both Intel and Apple Silicon
      binaryName = "yt-dlp_macos"
    } else if (platform === "linux") {
      // Linux: Use standalone executable
      if (arch === "arm64") {
        binaryName = "yt-dlp_linux_aarch64"
      } else if (arch === "x64") {
        binaryName = "yt-dlp_linux"
      } else {
        binaryName = "yt-dlp_linux"
      }
    }
    
    // GitHub releases URL for latest version
    const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`
    
    console.log(`[yt-dlp] Downloading standalone binary from: ${downloadUrl}`)
    
    const file = createWriteStream(targetPath)
    
    const makeRequest = (url: string, maxRedirects = 5): void => {
      if (maxRedirects <= 0) {
        reject(new Error("Too many redirects"))
        return
      }
      
      https.get(url, (response) => {
        // Handle redirects (301, 302, 307, 308)
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location
          if (!redirectUrl) {
            reject(new Error("Redirect location not found"))
            return
          }
          
          // Follow redirect recursively
          console.log(`[yt-dlp] Following redirect to: ${redirectUrl}`)
          makeRequest(redirectUrl, maxRedirects - 1)
          return
        }
        
        if (response.statusCode === 200) {
          response.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve()
          })
          file.on("error", (err) => {
            unlink(targetPath, () => {}) // Delete partial file
            reject(err)
          })
        } else {
          reject(new Error(`Download failed with status: ${response.statusCode}`))
        }
      }).on("error", (err) => {
        unlink(targetPath, () => {}) // Delete partial file
        reject(err)
      })
    }
    
    makeRequest(downloadUrl)
  })
}

/**
 * Ensure yt-dlp binary exists locally
 * Downloads standalone executable from GitHub if missing
 */
export async function ensureYtDlpBinary(): Promise<string> {
  // Create bin directory if it doesn't exist
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true })
    console.log("[yt-dlp] Created bin directory:", binDir)
  }

  // Check if binary exists
  if (!existsSync(binPath)) {
    console.log("[yt-dlp] Binary missing — downloading standalone executable from GitHub...")
    
    try {
      // Always download standalone binary directly from GitHub
      // This ensures we get the platform-specific executable (not Python script)
      await downloadBinaryFromGitHub(binPath)
      
      // Make binary executable (Unix-like systems)
      if (process.platform !== "win32") {
        chmodSync(binPath, 0o755)
      }
      console.log("[yt-dlp] Standalone binary downloaded and ready:", binPath)
    } catch (error: any) {
      console.error("[yt-dlp] Failed to download binary:", error.message)
      throw new Error(`Failed to download yt-dlp binary: ${error.message}`)
    }
  } else {
    console.log("[yt-dlp] Binary already exists:", binPath)
  }

  return binPath
}

/**
 * Get the local binary path (does not download)
 */
export function getYtDlpBinaryPath(): string {
  return binPath
}
