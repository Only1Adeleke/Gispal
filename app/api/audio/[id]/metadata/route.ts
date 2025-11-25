import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const metadataSchema = z.object({
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  producer: z.string().optional(),
  year: z.string().optional(),
  tags: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = metadataSchema.parse(body)

    const audio = await db.audios.findById(params.id)
    if (!audio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    // Update audio with new metadata
    const updatedAudio = await db.audios.update(params.id, {
      title: validatedData.title,
      tags: validatedData.tags,
      artist: validatedData.artist,
      album: validatedData.album,
      producer: validatedData.producer,
      year: validatedData.year,
    })

    if (!updatedAudio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 })
    }

    return NextResponse.json(updatedAudio)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid metadata format", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating metadata:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update metadata" },
      { status: 500 }
    )
  }
}

