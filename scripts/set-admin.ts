// Script to set a user as admin by email
// Run with: npx tsx scripts/set-admin.ts hi.adeleke@gmail.com

import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import path from "path"
import { users } from "../lib/db/schema"
import { eq } from "drizzle-orm"

async function setAdmin(email: string) {
  // First, find the user in Better Auth's database to get their ID
  const betterAuthDbPath = path.join(process.cwd(), "sqlite.db")
  const betterAuthDb = new Database(betterAuthDbPath)
  
  const betterAuthUser = betterAuthDb
    .prepare("SELECT id, email, name FROM user WHERE email = ?")
    .get(email) as { id: string; email: string; name: string } | undefined

  betterAuthDb.close()

  if (!betterAuthUser) {
    console.error(`❌ User with email ${email} not found in Better Auth database`)
    console.error(`   Make sure the user has registered at /register first`)
    process.exit(1)
  }

  console.log(`Found user: ${betterAuthUser.name} (${betterAuthUser.email})`)

  // Connect to application database
  const appDbPath = path.join(process.cwd(), "drizzle.db")
  const sqlite = new Database(appDbPath)
  const db = drizzle(sqlite, { schema: { users } })

  try {
    // Check if user exists in our application database
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.id, betterAuthUser.id))
      .limit(1)
      .all()[0]

    if (!existingUser) {
      // Create user in our database if they don't exist
      console.log("Creating user in application database...")
      db.insert(users).values({
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        name: betterAuthUser.name,
        plan: "free",
        bandwidthLimit: 100 * 1024 * 1024, // 100MB default
        role: "admin",
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run()
      console.log(`✅ Created and set ${email} as admin`)
    } else {
      // Update user role to admin
      if (existingUser.role === "admin" || existingUser.isAdmin) {
        console.log(`ℹ️  User ${email} is already an admin`)
      } else {
        db
          .update(users)
          .set({
            role: "admin",
            isAdmin: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, betterAuthUser.id))
          .run()
        console.log(`✅ Successfully set ${email} as admin`)
      }
    }
  } finally {
    sqlite.close()
  }

  process.exit(0)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: npx tsx scripts/set-admin.ts <email>")
  process.exit(1)
}

setAdmin(email).catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
