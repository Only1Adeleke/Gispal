// Script to delete a user completely from both Better Auth and application database
// Run with: npx tsx scripts/delete-user.ts hi.adeleke@gmail.com

import { db } from "../lib/db"
import Database from "better-sqlite3"
import path from "path"

async function deleteUser(email: string) {
  const dbPath = path.join(process.cwd(), "sqlite.db")
  const sqlite = new Database(dbPath)
  
  // Find the user in Better Auth database
  const betterAuthUser = sqlite
    .prepare("SELECT id, email, name FROM user WHERE email = ?")
    .get(email) as { id: string; email: string; name: string } | undefined

  if (!betterAuthUser) {
    console.error(`❌ User with email ${email} not found in Better Auth database`)
    sqlite.close()
    process.exit(1)
  }

  console.log(`Found user: ${betterAuthUser.name} (${betterAuthUser.email})`)
  console.log(`User ID: ${betterAuthUser.id}`)

  // Delete from Better Auth database (cascade delete related records)
  console.log("\n🗑️  Deleting from Better Auth database...")
  
  // Delete sessions
  const deleteSessions = sqlite.prepare("DELETE FROM session WHERE userId = ?")
  const sessionsDeleted = deleteSessions.run(betterAuthUser.id).changes
  console.log(`   Deleted ${sessionsDeleted} session(s)`)

  // Delete accounts
  const deleteAccounts = sqlite.prepare("DELETE FROM account WHERE userId = ?")
  const accountsDeleted = deleteAccounts.run(betterAuthUser.id).changes
  console.log(`   Deleted ${accountsDeleted} account(s)`)

  // Delete verifications (if table exists and has userId column)
  try {
    const deleteVerifications = sqlite.prepare("DELETE FROM verification WHERE userId = ?")
    const verificationsDeleted = deleteVerifications.run(betterAuthUser.id).changes
    console.log(`   Deleted ${verificationsDeleted} verification(s)`)
  } catch (error: any) {
    // Verification table might not have userId column or might not exist
    console.log(`   Skipped verification deletion (table structure may differ)`)
  }

  // Finally delete the user
  const deleteUser = sqlite.prepare("DELETE FROM user WHERE id = ?")
  const userDeleted = deleteUser.run(betterAuthUser.id).changes
  console.log(`   Deleted user record`)

  sqlite.close()

  // Delete from application database
  console.log("\n🗑️  Deleting from application database...")
  const appUser = await db.users.findById(betterAuthUser.id)
  
  if (appUser) {
    // Delete user's jingles
    const userJingles = await db.jingles.findByUserId(betterAuthUser.id)
    for (const jingle of userJingles) {
      await db.jingles.delete(jingle.id)
    }
    console.log(`   Deleted ${userJingles.length} jingle(s)`)

    // Delete user's cover arts
    const userCoverArts = await db.coverArts.findByUserId(betterAuthUser.id)
    for (const coverArt of userCoverArts) {
      await db.coverArts.delete(coverArt.id)
    }
    console.log(`   Deleted ${userCoverArts.length} cover art(s)`)

    // Delete user's mixes
    const userMixes = await db.mixes.findByUserId(betterAuthUser.id)
    for (const mix of userMixes) {
      await db.mixes.delete(mix.id)
    }
    console.log(`   Deleted ${userMixes.length} mix(es)`)

    // Delete user from application database
    const users = (db.users as any).users || new Map()
    users.delete(betterAuthUser.id)
    console.log(`   Deleted user from application database`)
  } else {
    console.log(`   User not found in application database (may have been already deleted)`)
  }

  console.log(`\n✅ Successfully deleted user: ${email}`)
  console.log(`\n📝 You can now register again with the same email address.`)
  
  process.exit(0)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: npx tsx scripts/delete-user.ts <email>")
  process.exit(1)
}

deleteUser(email).catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})

