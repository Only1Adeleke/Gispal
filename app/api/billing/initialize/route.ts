import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { initializePayment } from "@/lib/payments/paystack"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await request.json()
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    const user = await db.users.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { authorizationUrl, reference } = await initializePayment(
      user.email,
      planId,
      session.user.id
    )

    return NextResponse.json({
      authorizationUrl,
      reference,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    )
  }
}

