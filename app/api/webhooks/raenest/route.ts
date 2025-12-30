/**
 * POST /api/webhooks/raenest
 * Webhook handler for Raenest payment notifications
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/drizzle"
import { userSubscriptions, paymentPlans, apiKeys } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSchema = z.object({
  event: z.string(),
  paymentLinkID: z.string().optional(),
  paymentID: z.string().optional(),
  status: z.enum(["success", "failed", "pending"]).optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * POST /api/webhooks/raenest
 * Handle Raenest payment webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (add your Raenest webhook secret)
    const webhookSecret = request.headers.get("x-raenest-secret")
    const expectedSecret = process.env.RAENEST_WEBHOOK_SECRET

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = webhookSchema.parse(body)

    // Handle payment success event
    if (validated.event === "payment.success" && validated.status === "success") {
      const paymentLinkID = validated.paymentLinkID || validated.metadata?.paymentLinkID
      const paymentID = validated.paymentID || validated.metadata?.paymentID

      if (!paymentLinkID) {
        console.error("[RAENEST-WEBHOOK] Missing paymentLinkID")
        return NextResponse.json({ error: "Missing paymentLinkID" }, { status: 400 })
      }

      // Find subscription by payment link ID or payment ID
      const subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.raenestPaymentId, paymentLinkID),
          eq(userSubscriptions.status, "pending")
        ),
        with: {
          plan: true,
        },
      })

      if (!subscription) {
        console.error("[RAENEST-WEBHOOK] Subscription not found for payment:", paymentLinkID)
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
      }

      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year subscription

      // Update subscription to active
      await db
        .update(userSubscriptions)
        .set({
          status: "active",
          raenestPaymentId: paymentID || paymentLinkID,
          startsAt: now,
          expiresAt: expiresAt,
          updatedAt: now,
        })
        .where(eq(userSubscriptions.id, subscription.id))

      // Update all API keys for this user with new rate limits
      if (subscription.plan) {
        await db
          .update(apiKeys)
          .set({
            rateLimitPerMinute: subscription.plan.rateLimitPerMin,
            rateLimitPerDay: subscription.plan.rateLimitPerDay,
            updatedAt: now,
          })
          .where(eq(apiKeys.userId, subscription.userId))

        console.log(
          `[RAENEST-WEBHOOK] Updated subscription and API keys for user ${subscription.userId} to plan ${subscription.plan.name}`
        )
      }

      return NextResponse.json({ success: true, message: "Payment processed successfully" })
    }

    // Handle other events (payment.failed, etc.)
    console.log("[RAENEST-WEBHOOK] Received event:", validated.event, validated.status)

    return NextResponse.json({ success: true, message: "Webhook received" })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[RAENEST-WEBHOOK] Validation error:", error.errors)
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[RAENEST-WEBHOOK] Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

