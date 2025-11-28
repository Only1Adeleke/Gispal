import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const filePath = path.join(process.cwd(), "storage", "cover-art", ...params.path)
    
    // Security: Ensure the file is within the cover-art directory
    const coverArtDir = path.join(process.cwd(), "storage", "cover-art")
    const resolvedPath = path.resolve(filePath)
    const resolvedCoverArtDir = path.resolve(coverArtDir)
    
    if (!resolvedPath.startsWith(resolvedCoverArtDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify user owns this cover art (first path segment should be userId)
    const pathUserId = params.path[0]
    if (pathUserId !== userId) {
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
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    console.error("[COVER-ART-SERVE] Error:", error)
    return NextResponse.json(
      { error: "Failed to serve cover art" },
      { status: 500 }
    )
  }
}

