/**
 * GET /api/payment/subscription
 * Get current user's subscription
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { userSubscriptions, paymentPlans } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get most recent subscription
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      with: {
        plan: true,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: subscription.id,
      planId: subscription.planId,
      status: subscription.status,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        description: subscription.plan.description,
        priceNgn: subscription.plan.priceNgn,
        rateLimitPerMin: subscription.plan.rateLimitPerMin,
        rateLimitPerDay: subscription.plan.rateLimitPerDay,
        raenestLink: subscription.plan.raenestLink,
      },
    })
  } catch (error: any) {
    console.error("[PAYMENT] Error fetching subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

