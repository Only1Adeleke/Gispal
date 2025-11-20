import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { storage } from "@/lib/storage"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jingle = await db.jingles.findById(params.id)
    if (!jingle || jingle.userId !== session.user.id) {
      return NextResponse.json({ error: "Jingle not found" }, { status: 404 })
    }

    // Extract key from URL and delete from storage
    const urlParts = jingle.fileUrl.split("/")
    const key = urlParts.slice(-2).join("/") // Get last two parts (jingles/userId/filename)
    await storage.delete(key).catch(() => {})

    await db.jingles.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete jingle" },
      { status: 500 }
    )
  }
}

