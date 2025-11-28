import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const storageDir = path.join(process.cwd(), "storage", "cover-art", userId)

    // Check if directory exists
    try {
      await fs.access(storageDir)
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json([])
    }

    // Read all files in the directory
    const files = await fs.readdir(storageDir)
    
    // Filter for .jpg files and map to paths
    const coverArts = files
      .filter(file => file.endsWith(".jpg"))
      .map(file => ({
        id: file.replace(".jpg", ""), // UUID without extension
        path: `/storage/cover-art/${userId}/${file}`,
        filename: file,
      }))

    return NextResponse.json(coverArts)
  } catch (error: any) {
    console.error("[COVER-ART-GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch cover arts" },
      { status: 500 }
    )
  }
}

// Serve individual cover art files
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { path: coverArtPath } = body

    if (!coverArtPath || !coverArtPath.startsWith("/storage/cover-art/")) {
      return NextResponse.json({ error: "Invalid cover art path" }, { status: 400 })
    }

    // Extract userId and filename from path
    const pathParts = coverArtPath.replace("/storage/cover-art/", "").split("/")
    const fileUserId = pathParts[0]
    const filename = pathParts[1]

    // Verify the user owns this cover art
    if (fileUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Read and serve the file
    const filePath = path.join(process.cwd(), "storage", "cover-art", fileUserId, filename)
    
    try {
      const fileBuffer = await fs.readFile(filePath)
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": fileBuffer.length.toString(),
        },
      })
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error: any) {
    console.error("[COVER-ART-SERVE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to serve cover art" },
      { status: 500 }
    )
  }
}
