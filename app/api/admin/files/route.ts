import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const fileType = searchParams.get("fileType") || ""

    const jingles = await db.jingles.findAll()
    const coverArts = await db.coverArts.findAll()
    const allUsers = await db.users.findAll()

    let files = [
      ...jingles.map((j) => ({
        id: j.id,
        type: "jingle" as const,
        userId: j.userId,
        name: j.name,
        size: j.fileSize,
        url: j.fileUrl,
        createdAt: j.createdAt,
        expiresAt: null as Date | null,
      })),
      ...coverArts.map((c) => ({
        id: c.id,
        type: "cover-art" as const,
        userId: c.userId,
        name: c.name,
        size: c.fileSize,
        url: c.fileUrl,
        createdAt: c.createdAt,
        expiresAt: null as Date | null,
      })),
    ]

    // Apply filters
    if (fileType && fileType !== "all") {
      files = files.filter((file) => file.type === fileType)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      files = files.filter(
        (file) =>
          file.name.toLowerCase().includes(searchLower) ||
          allUsers.find((u) => u.id === file.userId)?.email.toLowerCase().includes(searchLower)
      )
    }

    // Add user email to each file
    const filesWithUsers = files.map((file) => {
      const user = allUsers.find((u) => u.id === file.userId)
      return {
        ...file,
        userEmail: user?.email || "Unknown",
      }
    })

    // Pagination
    const total = filesWithUsers.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedFiles = filesWithUsers.slice(start, end)

    return NextResponse.json({
      data: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")
    const fileType = searchParams.get("fileType")

    if (!fileId || !fileType) {
      return NextResponse.json(
        { error: "fileId and fileType are required" },
        { status: 400 }
      )
    }

    if (fileType === "jingle") {
      await db.jingles.delete(fileId)
    } else if (fileType === "cover-art") {
      await db.coverArts.delete(fileId)
    } else {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

