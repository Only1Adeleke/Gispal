import axios from "axios"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || ""

export interface Plan {
  id: string
  name: string
  amount: number // in kobo (Nigerian currency)
  interval: "daily" | "weekly" | "monthly"
  bandwidth: number | "unlimited" // in bytes
}

export const PLANS: Record<string, Plan> = {
  daily_unlimited: {
    id: "daily_unlimited",
    name: "Daily Unlimited",
    amount: 10000, // 100 NGN
    interval: "daily",
    bandwidth: "unlimited",
  },
  daily_250mb: {
    id: "daily_250mb",
    name: "Daily 250MB",
    amount: 5000, // 50 NGN
    interval: "daily",
    bandwidth: 250 * 1024 * 1024,
  },
  weekly_unlimited: {
    id: "weekly_unlimited",
    name: "Weekly Unlimited",
    amount: 50000, // 500 NGN
    interval: "weekly",
    bandwidth: "unlimited",
  },
  weekly_300mb: {
    id: "weekly_300mb",
    name: "Weekly 300MB",
    amount: 25000, // 250 NGN
    interval: "weekly",
    bandwidth: 300 * 1024 * 1024,
  },
  monthly_unlimited: {
    id: "monthly_unlimited",
    name: "Monthly Unlimited",
    amount: 150000, // 1500 NGN
    interval: "monthly",
    bandwidth: "unlimited",
  },
  monthly_5000mb: {
    id: "monthly_5000mb",
    name: "Monthly 5000MB",
    amount: 100000, // 1000 NGN
    interval: "monthly",
    bandwidth: 5000 * 1024 * 1024,
  },
}

export async function initializePayment(
  email: string,
  planId: string,
  userId: string
): Promise<{ authorizationUrl: string; reference: string }> {
  const plan = PLANS[planId]
  if (!plan) {
    throw new Error("Invalid plan")
  }

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount: plan.amount,
      metadata: {
        planId,
        userId,
      },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing/callback`,
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  )

  return {
    authorizationUrl: response.data.data.authorization_url,
    reference: response.data.data.reference,
  }
}

export async function verifyPayment(reference: string): Promise<{
  success: boolean
  planId?: string
  userId?: string
}> {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  if (response.data.status && response.data.data.status === "success") {
    const metadata = response.data.data.metadata
    return {
      success: true,
      planId: metadata.planId,
      userId: metadata.userId,
    }
  }

  return { success: false }
}

export function calculateExpirationDate(
  interval: "daily" | "weekly" | "monthly"
): Date {
  const now = new Date()
  switch (interval) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case "monthly":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }
}

