const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

const dbPath = path.join(process.cwd(), "sqlite.db")

// Create database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  const Database = require("better-sqlite3")
  const db = new Database(dbPath)
  db.close()
  console.log("Created sqlite.db")
}

// Run migrations
try {
  console.log("Running Better Auth migrations...")
  execSync("npx @better-auth/cli migrate --yes", { stdio: "inherit", cwd: process.cwd() })
  console.log("Migrations completed successfully")
} catch (error) {
  console.error("Migration error:", error.message)
  process.exit(1)
}

