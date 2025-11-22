import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { storage } from "@/lib/storage"
import { getMaxJingles, isProPlan } from "@/lib/plan-restrictions"
import { getAudioDuration } from "@/lib/ffmpeg"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create user in our database
    let user = await db.users.findById(session.user.id)
    if (!user) {
      try {
        user = await db.users.create(
          {
            email: session.user.email || "",
            name: session.user.name || undefined,
            plan: "free",
            bandwidthLimit: 100 * 1024 * 1024, // 100MB default
          },
          session.user.id // Use Better Auth's user ID
        )
        // Set first user as admin if they are the only user
        const allUsers = await db.users.findAll()
        if (allUsers.length === 1) {
          user = await db.users.update(user.id, { role: "admin" })
        }
      } catch (error) {
        console.error("Error creating user in jingles upload route:", error)
        return NextResponse.json(
          { error: "Failed to initialize user data" },
          { status: 500 }
        )
      }
    }

    // Check jingle limit
    const existingJingles = await db.jingles.findByUserId(session.user.id)
    const maxJingles = getMaxJingles(user.plan)
    
    if (existingJingles.length >= maxJingles) {
      return NextResponse.json(
        { error: `Maximum ${maxJingles} jingle(s) allowed for your plan. Please delete an existing jingle first.` },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileKey = `jingles/${session.user.id}/${Date.now()}_${file.name}`
    const fileUrl = await storage.upload(buffer, fileKey, file.type)

    // Save to temp to get duration
    const fs = require("fs/promises")
    const path = require("path")
    const tempDir = "/tmp/gispal"
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true }).catch(() => {})
    const tempPath = path.join(tempDir, `${Date.now()}_${file.name}`)
    await fs.writeFile(tempPath, buffer)
    const duration = await getAudioDuration(tempPath).catch(() => undefined)
    await fs.unlink(tempPath).catch(() => {})

    const jingle = await db.jingles.create({
      userId: session.user.id,
      name: name || file.name,
      fileUrl,
      fileSize: buffer.length,
      duration,
    })

    return NextResponse.json(jingle)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload jingle" },
      { status: 500 }
    )
  }
}

