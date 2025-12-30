/**
 * GET /api/payment/plans
 * Get all available payment plans
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/drizzle"
import { paymentPlans } from "@/lib/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const plans = await db.select().from(paymentPlans).orderBy(paymentPlans.priceNgn)

    return NextResponse.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceNgn: plan.priceNgn,
        rateLimitPerMin: plan.rateLimitPerMin,
        rateLimitPerDay: plan.rateLimitPerDay,
        raenestLink: plan.raenestLink,
      })),
    })
  } catch (error: any) {
    console.error("[PAYMENT] Error fetching plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

