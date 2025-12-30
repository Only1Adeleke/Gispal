/**
 * Quick database check script
 * Verifies tables exist
 */

const Database = require("better-sqlite3")
const path = require("path")
const fs = require("fs")

const dbPath = path.join(process.cwd(), "drizzle.db")

if (!fs.existsSync(dbPath)) {
  console.log("❌ Database file does not exist")
  process.exit(1)
}

const db = new Database(dbPath)

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  const tableNames = tables.map((t) => t.name)
  
  console.log("✓ Database file exists")
  console.log(`✓ Found ${tableNames.length} tables:`)
  tableNames.forEach((name) => console.log(`  - ${name}`))
  
  // Check for required tables
  const requiredTables = ["users", "api_keys", "payment_plans", "user_subscriptions"]
  const missing = requiredTables.filter((t) => !tableNames.includes(t))
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing required tables: ${missing.join(", ")}`)
    process.exit(1)
  } else {
    console.log("\n✅ All required tables exist")
  }
} catch (error) {
  console.error("❌ Error checking database:", error.message)
  process.exit(1)
} finally {
  db.close()
}

