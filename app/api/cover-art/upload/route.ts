import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import { promises as fsPromises } from "fs"
import path from "path"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Generate UUID for filename
    const uuid = randomUUID()
    const filename = `${uuid}.jpg`

    // Create storage directory structure
    const storageDir = path.join(process.cwd(), "storage", "cover-art", userId)
    await fsPromises.mkdir(storageDir, { recursive: true })

    // Save as JPEG (file extension will be .jpg)
    const outputPath = path.join(storageDir, filename)
    await fsPromises.writeFile(outputPath, fileBuffer)
    
    console.log("[COVER-ART-UPLOAD] Saved cover art to:", outputPath)

    // Return the storage path
    const storagePath = `/storage/cover-art/${userId}/${filename}`

    return NextResponse.json({
      success: true,
      path: storagePath,
    })
  } catch (error: any) {
    console.error("[COVER-ART-UPLOAD] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload cover art" },
      { status: 500 }
    )
  }
}

