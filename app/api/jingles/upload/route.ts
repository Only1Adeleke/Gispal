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

    const user = await db.users.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
    const tempPath = `/tmp/gispal/${Date.now()}_${file.name}`
    await require("fs/promises").writeFile(tempPath, buffer)
    const duration = await getAudioDuration(tempPath).catch(() => undefined)
    await require("fs/promises").unlink(tempPath).catch(() => {})

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

