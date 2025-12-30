import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name || "User",
        email: session.user.email || "user@example.com",
        image: session.user.image,
      },
    })
  } catch (error: any) {
    console.error("[AUTH] Error getting session:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

