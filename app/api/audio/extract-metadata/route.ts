import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { downloadYouTubeAudio } from "@/lib/youtube/downloader"

export const runtime = "nodejs"

/**
 * Local YouTube URL validator (no external dependencies)
 */
function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url)
}

/**
 * Extract filename from URL path
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split("/").pop() || ""
    return filename.replace(/\.[^/.]+$/, "") // Remove extension
  } catch {
    return "Untitled"
  }
}

/**
 * Extract filename from File object (without extension)
 */
function extractFilenameFromFile(file: File): string {
  const name = file.name
  return name.replace(/\.[^/.]+$/, "") // Remove extension
}

/**
 * Get current year as string
 */
function getCurrentYear(): string {
  return new Date().getFullYear().toString()
}

/**
 * Parse artist and title from filename
 * Handles formats like "Chella-My-Darling.mp3" → { artist: "Chella", title: "My Darling" }
 */
function parseArtistAndTitle(filename: string): { artist: string; title: string } {
  const clean = filename
    .replace(/\.(mp3|wav|ogg|m4a|flac)$/i, "")
    .replace(/_/g, " ")
    .trim()

  const separators = [" - ", "-", "–", "—"]

  for (const sep of separators) {
    if (clean.includes(sep)) {
      const parts = clean.split(sep).map(s => s.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          artist: parts[0],
          title: parts.slice(1).join(sep), // Handle multiple separators
        }
      }
    }
  }

  return {
    artist: "",
    title: clean,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const url = formData.get("url") as string | null
    const sourceType = formData.get("sourceType") as string | null

    const currentYear = getCurrentYear()

    // Case A: Uploaded file
    if (file) {
      const filename = extractFilenameFromFile(file)
      const { artist, title } = parseArtistAndTitle(filename)
      
      const metadata = {
        title: title || "Untitled",
        artist: artist || "Unknown Artist",
        album: "",
        genre: "",
        year: currentYear,
        coverArtUrl: null,
        source: "upload" as const,
        format: file.type || "audio/mpeg",
        autoFilled: {
          title: !!title,
          artist: !!artist,
        },
      }

      return NextResponse.json(metadata)
    }

    // Case B: YouTube URL
    if (url && (sourceType === "youtube" || isYouTubeUrl(url))) {
      try {
        // Get YouTube video info (this will download audio, but we only use metadata)
        const result = await downloadYouTubeAudio(url)
        
        const metadata = {
          title: result.title || "Untitled",
          artist: result.artist || "Unknown Artist",
          album: "",
          genre: "",
          year: currentYear,
          coverArtUrl: result.thumbnail || null,
          source: "youtube" as const,
          duration: result.duration || undefined,
          format: "audio/mpeg",
          autoFilled: {
            title: !!result.title,
            artist: !!result.artist,
            coverArtUrl: !!result.thumbnail,
          },
        }

        return NextResponse.json(metadata)
      } catch (error: any) {
        console.error("[EXTRACT-METADATA] YouTube error:", error)
        return NextResponse.json(
          { error: `Failed to extract YouTube metadata: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Case C: Direct MP3 URL
    if (url) {
      try {
        // Validate URL with HEAD request
        const headResponse = await fetch(url, { method: "HEAD" })
        if (!headResponse.ok) {
          return NextResponse.json(
            { error: "Failed to access audio URL" },
            { status: 400 }
          )
        }

        // Extract filename from URL
        const filename = extractFilenameFromUrl(url)
        const { artist, title } = parseArtistAndTitle(filename)
        
        const metadata = {
          title: title || "Untitled",
          artist: artist || "",
          album: "",
          genre: "",
          year: currentYear,
          coverArtUrl: null,
          source: "mp3-url" as const,
          format: "audio/mpeg",
          autoFilled: {
            title: !!title,
            artist: !!artist,
          },
        }

        return NextResponse.json(metadata)
      } catch (error: any) {
        console.error("[EXTRACT-METADATA] URL error:", error)
        return NextResponse.json(
          { error: `Failed to extract metadata from URL: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // No valid source provided
    return NextResponse.json(
      { error: "No file or URL provided" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("[EXTRACT-METADATA] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to extract metadata" },
      { status: 500 }
    )
  }
}
