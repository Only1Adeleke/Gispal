// Seed script to set first user as admin
// Run with: npx tsx scripts/seed-admin.ts

import { db } from "../lib/db"

async function seedAdmin() {
  const allUsers = await db.users.findAll()
  
  if (allUsers.length === 0) {
    console.log("No users found. Create a user first through registration.")
    process.exit(0)
  }

  // Set first user as admin
  const firstUser = allUsers[0]
  if (firstUser.role !== "admin") {
    await db.users.update(firstUser.id, { role: "admin" })
    console.log(`✅ Set ${firstUser.email} as admin`)
  } else {
    console.log(`ℹ️  ${firstUser.email} is already an admin`)
  }
  
  process.exit(0)
}

seedAdmin().catch(console.error)

