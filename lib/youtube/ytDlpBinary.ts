/**
 * Local yt-dlp binary management
 * Automatically downloads and manages yt-dlp binary in project/bin directory
 * No dependency on system PATH, brew, or pip
 */

import { existsSync, mkdirSync, chmodSync, copyFileSync, unlink } from "fs"
import * as path from "path"
import * as https from "https"
import { createWriteStream } from "fs"

const binDir = path.resolve(process.cwd(), "bin")
const binPath = path.join(binDir, "yt-dlp")

/**
 * Download yt-dlp binary directly from GitHub releases
 */
async function downloadBinaryFromGitHub(targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine platform-specific binary name
    const platform = process.platform
    let binaryName = "yt-dlp"
    
    if (platform === "win32") {
      binaryName = "yt-dlp.exe"
    }
    
    // GitHub releases URL for latest version
    const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`
    
    console.log(`[yt-dlp] Downloading from: ${downloadUrl}`)
    
    const file = createWriteStream(targetPath)
    
    https.get(downloadUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (!redirectUrl) {
          reject(new Error("Redirect location not found"))
          return
        }
        
        https.get(redirectUrl, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(new Error(`Download failed with status: ${redirectResponse.statusCode}`))
            return
          }
          
          redirectResponse.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve()
          })
        }).on("error", (err) => {
          unlink(targetPath, () => {}) // Delete partial file
          reject(err)
        })
      } else if (response.statusCode === 200) {
        response.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve()
        })
      } else {
        reject(new Error(`Download failed with status: ${response.statusCode}`))
      }
    }).on("error", (err) => {
      unlink(targetPath, () => {}) // Delete partial file
      reject(err)
    })
  })
}

/**
 * Ensure yt-dlp binary exists locally
 * Downloads from GitHub if missing
 */
export async function ensureYtDlpBinary(): Promise<string> {
  // Create bin directory if it doesn't exist
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true })
    console.log("[yt-dlp] Created bin directory:", binDir)
  }

  // Check if binary exists
  if (!existsSync(binPath)) {
    console.log("[yt-dlp] Binary missing — downloading from GitHub...")
    
    try {
      // Try using yt-dlp-wrap first (if it has downloadFromGithub)
      const YTDlpWrapModule = require("yt-dlp-wrap")
      const YTDlpWrap = YTDlpWrapModule.default || YTDlpWrapModule
      
      if (typeof YTDlpWrap.downloadFromGithub === "function") {
        await YTDlpWrap.downloadFromGithub(binPath)
        console.log("[yt-dlp] Downloaded via yt-dlp-wrap")
      } else {
        // Fallback: try to get binary from yt-dlp-wrap's cache
        try {
          const tempWrap = new YTDlpWrap()
          await tempWrap.getVersion() // This triggers download
          
          const tempPath = (tempWrap as any).ytDlpPath || (tempWrap as any).binaryPath
          if (tempPath && existsSync(tempPath)) {
            copyFileSync(tempPath, binPath)
            console.log("[yt-dlp] Copied from yt-dlp-wrap cache")
          } else {
            throw new Error("Could not locate cached binary")
          }
        } catch (wrapError: any) {
          // If yt-dlp-wrap fails, download directly from GitHub
          console.log("[yt-dlp] yt-dlp-wrap method failed, downloading directly from GitHub...")
          await downloadBinaryFromGitHub(binPath)
        }
      }
      
      // Make binary executable (Unix-like systems)
      if (process.platform !== "win32") {
        chmodSync(binPath, 0o755)
      }
      console.log("[yt-dlp] Binary downloaded and ready:", binPath)
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
