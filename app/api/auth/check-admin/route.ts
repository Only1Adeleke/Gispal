/**
 * GET /api/auth/check-admin
 * Check if current user is admin
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api/middleware/adminGuard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    const userIsAdmin = await isAdmin(session.user.id)

    return NextResponse.json({ isAdmin: userIsAdmin })
  } catch (error: any) {
    console.error("[AUTH] Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}

