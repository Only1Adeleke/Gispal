import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), "storage", ...params.path)
    
    // Security: Ensure the file is within the storage directory
    const storageDir = path.join(process.cwd(), "storage")
    const resolvedPath = path.resolve(filePath)
    const resolvedStorageDir = path.resolve(storageDir)
    
    if (!resolvedPath.startsWith(resolvedStorageDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    
    // Determine content type
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
    }
    
    const contentType = contentTypeMap[ext] || "application/octet-stream"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    console.error("Error serving file:", error)
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    )
  }
}

