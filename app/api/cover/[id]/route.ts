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

    const coverArt = await db.coverArts.findById(params.id)
    if (!coverArt || coverArt.userId !== session.user.id) {
      return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
    }

    // Extract key from URL and delete from storage
    const urlParts = coverArt.fileUrl.split("/")
    const key = urlParts.slice(-2).join("/")
    await storage.delete(key).catch(() => {})

    await db.coverArts.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete cover art" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const coverArt = await db.coverArts.findById(params.id)
    if (!coverArt || coverArt.userId !== session.user.id) {
      return NextResponse.json({ error: "Cover art not found" }, { status: 404 })
    }

    const { isDefault } = await request.json()
    if (isDefault) {
      await db.coverArts.setDefault(session.user.id, params.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update cover art" },
      { status: 500 }
    )
  }
}

