import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = path.join(process.cwd(), "tmp", "gispal", params.filename)
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(path.join(process.cwd(), "tmp", "gispal"))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    const file = await fs.readFile(filePath)
    const ext = path.extname(params.filename).toLowerCase()
    
    const contentType: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    }

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType[ext] || "application/octet-stream",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}

