/**
 * Complete Database Initialization Script
 * Runs migrations and seeds data
 */

const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

console.log("=".repeat(60))
console.log("DATABASE INITIALIZATION")
console.log("=".repeat(60))

const databaseUrl = process.env.DATABASE_URL
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("pg://")
)

// Step 1: Create database file if SQLite
if (!isPostgres) {
  const dbPath = path.join(process.cwd(), "drizzle.db")
  if (!fs.existsSync(dbPath)) {
    const Database = require("better-sqlite3")
    const db = new Database(dbPath)
    db.close()
    console.log("\n[1/4] Created drizzle.db file")
  } else {
    console.log("\n[1/4] Database file exists")
  }
}

// Step 2: Create tables directly (for SQLite) or generate migrations (for Postgres)
const migrationsFolder = path.join(process.cwd(), "drizzle")
if (isPostgres) {
  console.log("\n[2/4] Generating PostgreSQL migrations...")
  try {
    if (!fs.existsSync(migrationsFolder) || fs.readdirSync(migrationsFolder).length === 0) {
      execSync("npx drizzle-kit generate", { stdio: "inherit", cwd: process.cwd() })
      console.log("✓ Migrations generated")
    } else {
      console.log("✓ Migrations already exist")
    }
  } catch (error) {
    console.error("✗ Failed to generate migrations:", error.message)
    process.exit(1)
  }
} else {
  console.log("\n[2/4] Creating SQLite tables...")
  try {
    execSync("node scripts/create-tables.js", { stdio: "inherit", cwd: process.cwd() })
    console.log("✓ Tables created")
  } catch (error) {
    console.error("✗ Failed to create tables:", error.message)
    process.exit(1)
  }
}

// Step 3: Run migrations (for Postgres)
if (isPostgres) {
  console.log("\n[3/4] Running PostgreSQL migrations...")
  try {
    execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: process.cwd() })
    console.log("✓ Migrations completed")
  } catch (error) {
    console.error("✗ Migration failed:", error.message)
    process.exit(1)
  }
} else {
  console.log("\n[3/4] SQLite schema already applied (skipping migrations)")
}

// Step 4: Run Better Auth migrations
console.log("\n[4/4] Running Better Auth migrations...")
try {
  execSync("npx @better-auth/cli migrate --yes", { stdio: "inherit", cwd: process.cwd() })
  console.log("✓ Better Auth migrations completed")
} catch (error) {
  console.warn("⚠ Better Auth migration warning (may be expected):", error.message)
}

console.log("\n" + "=".repeat(60))
console.log("DATABASE INITIALIZATION COMPLETE")
console.log("=".repeat(60))
console.log("\nNext steps:")
console.log("1. Register a user account at /register")
console.log("2. Run: npm run set-admin <email> (to make user admin)")
console.log("3. Start the dev server: npm run dev")
