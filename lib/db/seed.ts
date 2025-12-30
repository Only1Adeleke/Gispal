/**
 * Database Seeding
 * Seeds initial data (admin user, payment plans) if tables are empty
 */

import { db } from "./index"
import { users, paymentPlans } from "./schema"
import { eq, count } from "drizzle-orm"
import { randomUUID } from "crypto"

export async function seedDatabase() {
  try {
    console.log("[SEED] Checking if database needs seeding...")
    
    // Check if users table exists and has any users
    let userCount = 0
    try {
      const result = await db.select({ count: count() }).from(users)
      userCount = result[0]?.count || 0
    } catch (error: any) {
      // Table doesn't exist yet, migrations haven't run
      console.log("[SEED] Users table doesn't exist yet, skipping seed")
      return
    }
    
    // Seed admin user if no users exist
    if (userCount === 0) {
      console.log("[SEED] No users found, creating admin user...")
      
      const adminEmail = process.env.ADMIN_EMAIL || "admin@gispal.com"
      
      // Note: Better Auth handles user creation, so we'll just log
      // The admin user should be created through Better Auth registration
      console.log("[SEED] Admin user should be created through registration")
      console.log("[SEED] Default admin email:", adminEmail)
      console.log("[SEED] After registration, run: npm run set-admin <email>")
    } else {
      console.log(`[SEED] Found ${userCount} users, skipping user seed`)
    }
    
    // Check if payment plans exist
    let planCount = 0
    try {
      const result = await db.select({ count: count() }).from(paymentPlans)
      planCount = result[0]?.count || 0
    } catch (error: any) {
      console.log("[SEED] Payment plans table doesn't exist yet")
    }
    
    // Seed payment plans if none exist
    if (planCount === 0) {
      console.log("[SEED] No payment plans found, seeding payment plans...")
      
      const plans = [
        {
          id: randomUUID(),
          name: "Free",
          description: "Basic access with limited features",
          priceNgn: 0,
          rateLimitPerMin: 60,
          rateLimitPerDay: 1000,
          raenestLink: null,
        },
        {
          id: randomUUID(),
          name: "Basic",
          description: "Increased limits for growing needs",
          priceNgn: 5000,
          rateLimitPerMin: 200,
          rateLimitPerDay: 10000,
          raenestLink: "https://app.raenest.com/invoice/payment/RNMTZJ37V_BASIC",
        },
        {
          id: randomUUID(),
          name: "Pro",
          description: "Professional tier with high limits",
          priceNgn: 15000,
          rateLimitPerMin: 500,
          rateLimitPerDay: 50000,
          raenestLink: "https://app.raenest.com/invoice/payment/RNMTZJ37V_PRO",
        },
        {
          id: randomUUID(),
          name: "Ultra",
          description: "Enterprise-grade access for heavy usage",
          priceNgn: 50000,
          rateLimitPerMin: 5000,
          rateLimitPerDay: 200000,
          raenestLink: "https://app.raenest.com/invoice/payment/RNMTZJ37V_ULTRA",
        },
      ]
      
      for (const plan of plans) {
        await db.insert(paymentPlans).values(plan)
      }
      
      console.log("[SEED] Payment plans seeded successfully")
    } else {
      console.log(`[SEED] Found ${planCount} payment plans, skipping plan seed`)
    }
    
    console.log("[SEED] Database seeding completed")
  } catch (error: any) {
    console.error("[SEED] Error seeding database:", error)
    throw error
  }
}

// If called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("[SEED] Seeding completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("[SEED] Seeding failed:", error)
      process.exit(1)
    })
}

