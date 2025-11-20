import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateApiKey, rotateApiKey } from "@/lib/auth/api-keys"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In production, return masked API key
    return NextResponse.json({
      hasApiKey: true,
      message: "API key exists (masked for security)",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get API key" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()
    
    if (action === "generate") {
      const apiKey = await generateApiKey(session.user.id)
      return NextResponse.json({ apiKey })
    } else if (action === "rotate") {
      const apiKey = await rotateApiKey(session.user.id)
      return NextResponse.json({ apiKey })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to manage API key" },
      { status: 500 }
    )
  }
}

