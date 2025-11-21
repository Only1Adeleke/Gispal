// Script to set a user as admin by email
// Run with: npx tsx scripts/set-admin.ts hi.adeleke@gmail.com

import { db } from "../lib/db"
import Database from "better-sqlite3"
import path from "path"

async function setAdmin(email: string) {
  // First, find the user in Better Auth's database to get their ID
  const dbPath = path.join(process.cwd(), "sqlite.db")
  const sqlite = new Database(dbPath)
  
  const betterAuthUser = sqlite
    .prepare("SELECT id, email, name FROM user WHERE email = ?")
    .get(email) as { id: string; email: string; name: string } | undefined

  sqlite.close()

  if (!betterAuthUser) {
    console.error(`❌ User with email ${email} not found in Better Auth database`)
    process.exit(1)
  }

  console.log(`Found user: ${betterAuthUser.name} (${betterAuthUser.email})`)

  // Check if user exists in our application database
  let user = await db.users.findById(betterAuthUser.id)

  if (!user) {
    // Create user in our database if they don't exist
    console.log("Creating user in application database...")
    user = await db.users.create(
      {
        email: betterAuthUser.email,
        name: betterAuthUser.name,
        plan: "free",
        bandwidthLimit: 100 * 1024 * 1024, // 100MB default
      },
      betterAuthUser.id // Use Better Auth's user ID
    )
  }

  // Update user role to admin
  if (user.role === "admin") {
    console.log(`ℹ️  User ${email} is already an admin`)
  } else {
    await db.users.update(user.id, { role: "admin" })
    console.log(`✅ Successfully set ${email} as admin`)
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

