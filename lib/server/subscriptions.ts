/**
 * Server-side subscription data fetching with caching
 * Used by Server Components for optimal performance
 */

import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/drizzle"
import { userSubscriptions, paymentPlans } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export interface ServerPaymentPlan {
  id: string
  name: string
  description: string | null
  priceNgn: number
  rateLimitPerMin: number
  rateLimitPerDay: number
  raenestLink: string | null
}

export interface ServerUserSubscription {
  id: string
  planId: string
  status: "pending" | "active" | "expired"
  startsAt: Date | string | null
  expiresAt: Date | string | null
  plan: ServerPaymentPlan
}

/**
 * Get current user session (server-side)
 */
async function getServerSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  return session
}

/**
 * Fetch all payment plans with caching
 */
export async function getPaymentPlans(): Promise<ServerPaymentPlan[]> {
  const getCachedPlans = unstable_cache(
    async () => {
      const plans = await db.select().from(paymentPlans)
      return plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceNgn: plan.priceNgn,
        rateLimitPerMin: plan.rateLimitPerMin,
        rateLimitPerDay: plan.rateLimitPerDay,
        raenestLink: plan.raenestLink,
      }))
    },
    ["payment-plans"],
    {
      revalidate: 120, // 2 minutes - plans don't change often
      tags: ["payment-plans"],
    }
  )

  return getCachedPlans()
}

/**
 * Fetch user's current subscription with caching
 */
export async function getUserSubscription(): Promise<ServerUserSubscription | null> {
  const session = await getServerSession()
  
  if (!session?.user) {
    return null
  }

  const userId = session.user.id

  const getCachedSubscription = unstable_cache(
    async () => {
      const subscription = await db
        .select({
          id: userSubscriptions.id,
          planId: userSubscriptions.planId,
          status: userSubscriptions.status,
          startsAt: userSubscriptions.startsAt,
          expiresAt: userSubscriptions.expiresAt,
        })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1)
        .then((rows) => rows[0])

      if (!subscription) {
        return null
      }

      const plan = await db
        .select()
        .from(paymentPlans)
        .where(eq(paymentPlans.id, subscription.planId))
        .limit(1)
        .then((rows) => rows[0])

      if (!plan) {
        return null
      }

      return {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status as "pending" | "active" | "expired",
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          priceNgn: plan.priceNgn,
          rateLimitPerMin: plan.rateLimitPerMin,
          rateLimitPerDay: plan.rateLimitPerDay,
          raenestLink: plan.raenestLink,
        },
      }
    },
    [`user-subscription-${userId}`],
    {
      revalidate: 60, // 1 minute
      tags: [`user-subscription-${userId}`],
    }
  )

  return getCachedSubscription()
}

