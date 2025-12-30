/**
 * Seed payment plans
 * Run this script to populate payment plans table
 */

import { db } from "@/lib/db/drizzle"
import { paymentPlans } from "@/lib/db/schema"

const plans = [
  {
    name: "Free",
    description: "Basic access with limited rate limits",
    priceNgn: 0,
    rateLimitPerMin: 60,
    rateLimitPerDay: 1000,
    raenestLink: null,
  },
  {
    name: "Basic",
    description: "Increased rate limits for small projects",
    priceNgn: 5000,
    rateLimitPerMin: 200,
    rateLimitPerDay: 10000,
    raenestLink: null, // Will be set when creating payment link
  },
  {
    name: "Pro",
    description: "High rate limits for production use",
    priceNgn: 15000,
    rateLimitPerMin: 500,
    rateLimitPerDay: 50000,
    raenestLink: null,
  },
  {
    name: "Ultra",
    description: "Maximum rate limits for enterprise use",
    priceNgn: 50000,
    rateLimitPerMin: 5000,
    rateLimitPerDay: 200000,
    raenestLink: null,
  },
]

async function seedPaymentPlans() {
  console.log("Seeding payment plans...")

  for (const plan of plans) {
    try {
      await db.insert(paymentPlans).values(plan).onConflictDoNothing()
      console.log(`✓ Seeded plan: ${plan.name}`)
    } catch (error) {
      console.error(`✗ Failed to seed plan ${plan.name}:`, error)
    }
  }

  console.log("Payment plans seeding completed!")
}

seedPaymentPlans()
  .then(() => {
    console.log("Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error seeding payment plans:", error)
    process.exit(1)
  })

