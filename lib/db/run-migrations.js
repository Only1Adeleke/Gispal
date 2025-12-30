/**
 * Database Migration Runner (JavaScript version for npm scripts)
 */

const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

const databaseUrl = process.env.DATABASE_URL
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("pg://")
)

function runMigrations() {
  try {
    if (isPostgres) {
      console.log("[MIGRATIONS] Running PostgreSQL migrations...")
      execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: process.cwd() })
      console.log("[MIGRATIONS] PostgreSQL migrations completed")
    } else {
      console.log("[MIGRATIONS] Running SQLite migrations...")
      
      const dbPath = path.join(process.cwd(), "drizzle.db")
      
      // Create database file if it doesn't exist
      if (!fs.existsSync(dbPath)) {
        const Database = require("better-sqlite3")
        const db = new Database(dbPath)
        db.close()
        console.log("[MIGRATIONS] Created drizzle.db file")
      }
      
      // Generate migrations if they don't exist
      const migrationsFolder = path.join(process.cwd(), "drizzle")
      if (!fs.existsSync(migrationsFolder) || fs.readdirSync(migrationsFolder).length === 0) {
        console.log("[MIGRATIONS] Generating initial migrations...")
        execSync("npx drizzle-kit generate", { stdio: "inherit", cwd: process.cwd() })
      }
      
      // Run migrations
      execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: process.cwd() })
      console.log("[MIGRATIONS] SQLite migrations completed")
    }
  } catch (error) {
    console.error("[MIGRATIONS] Error running migrations:", error.message)
    process.exit(1)
  }
}

runMigrations()

