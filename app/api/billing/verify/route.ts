import { NextRequest, NextResponse } from "next/server"
import { verifyPayment, calculateExpirationDate, PLANS } from "@/lib/payments/paystack"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()
    if (!reference) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 })
    }

    const result = await verifyPayment(reference)
    if (!result.success || !result.planId || !result.userId) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const plan = PLANS[result.planId]
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const user = await db.users.findById(result.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const expirationDate = calculateExpirationDate(plan.interval)
    const bandwidthLimit = plan.bandwidth === "unlimited" 
      ? Infinity 
      : plan.bandwidth

    await db.users.update(result.userId, {
      plan: result.planId as any,
      planExpiresAt: expirationDate,
      bandwidthLimit,
      bandwidthUsed: 0, // Reset bandwidth on plan upgrade
    })

    return NextResponse.json({
      success: true,
      plan: result.planId,
      expiresAt: expirationDate,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
}

