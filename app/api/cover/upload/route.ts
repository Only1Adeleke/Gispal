import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { storage } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const isDefault = formData.get("isDefault") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileKey = `coverart/${session.user.id}/${Date.now()}_${file.name}`
    const fileUrl = await storage.upload(buffer, fileKey, file.type)

    // If setting as default, unset other defaults
    if (isDefault) {
      const existingArts = await db.coverArts.findByUserId(session.user.id)
      for (const art of existingArts) {
        if (art.isDefault) {
          // Update to false - in production, use proper update method
        }
      }
    }

    const coverArt = await db.coverArts.create({
      userId: session.user.id,
      name: name || file.name,
      fileUrl,
      fileSize: buffer.length,
      isDefault: isDefault || false,
    })

    if (isDefault) {
      await db.coverArts.setDefault(session.user.id, coverArt.id)
    }

    return NextResponse.json(coverArt)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload cover art" },
      { status: 500 }
    )
  }
}

