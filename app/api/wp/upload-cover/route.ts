import { NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth/api-keys"
import { db } from "@/lib/db"
import { storage, tempStorage } from "@/lib/storage"
import { canSavePermanently, isProPlan } from "@/lib/plan-restrictions"

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const userId = await verifyApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = await db.users.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string || "WordPress Media"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // For free users, store temporarily; for Pro users, store permanently
    let fileUrl: string
    if (canSavePermanently(user.plan)) {
      // Pro users: store permanently
      const fileKey = `coverart/${userId}/wp_${Date.now()}_${file.name}`
      fileUrl = await storage.upload(buffer, fileKey, file.type)
      
      // Save to database
      const coverArt = await db.coverArts.create({
        userId,
        name,
        fileUrl,
        fileSize: buffer.length,
        isDefault: false,
      })
      
      return NextResponse.json({
        success: true,
        data: {
          id: coverArt.id,
          url: coverArt.fileUrl,
          name: coverArt.name,
        },
      })
    } else {
      // Free users: store temporarily (10 minutes)
      const filename = `wp_cover_${Date.now()}_${file.name}`
      const filePath = await tempStorage.save(buffer, filename)
      fileUrl = `/api/temp/${filename}`
      
      // Schedule deletion after 10 minutes
      setTimeout(async () => {
        const fs = await import("fs/promises")
        await fs.unlink(filePath).catch(() => {})
      }, 10 * 60 * 1000)
      
      return NextResponse.json({
        success: true,
        data: {
          url: fileUrl,
          name,
          temporary: true,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload cover art" },
      { status: 500 }
    )
  }
}

