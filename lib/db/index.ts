/**
 * Unified database connection
 * Supports both SQLite (development) and PostgreSQL (production)
 * Automatically selects based on DATABASE_URL environment variable
 * Auto-runs migrations in development mode
 */

import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import Database from "better-sqlite3"
import postgres from "postgres"
import path from "path"
import fs from "fs"

// Determine which database to use based on DATABASE_URL
const databaseUrl = process.env.DATABASE_URL

// Check if DATABASE_URL points to PostgreSQL
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("pg://")
)

let db: any
let schema: any

if (isPostgres) {
  // PostgreSQL connection
  console.log("[DB] Using PostgreSQL database")
  
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10)
  const client = postgres(databaseUrl!, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  
  // Import Postgres schema
  const postgresSchema = require("./schema-postgres")
  schema = postgresSchema
  
  db = drizzlePostgres(client, { schema: postgresSchema })
  
  // Graceful shutdown
  if (typeof process !== "undefined") {
    process.on("SIGINT", async () => {
      await client.end()
      process.exit(0)
    })
    process.on("SIGTERM", async () => {
      await client.end()
      process.exit(0)
    })
  }
} else {
  // SQLite connection (fallback for development)
  console.log("[DB] Using SQLite database")
  
  const dbPath = path.join(process.cwd(), "drizzle.db")
  
  // Create database file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    const tempDb = new Database(dbPath)
    tempDb.close()
    console.log("[DB] Created drizzle.db file")
  }
  
  // Initialize SQLite database
  const sqlite = new Database(dbPath)
  
  // Import SQLite schema
  const sqliteSchema = require("./schema")
  schema = sqliteSchema
  
  db = drizzleSQLite(sqlite, { schema: sqliteSchema })
  
  // Auto-create tables in development (non-blocking)
  if (process.env.NODE_ENV !== "production") {
    // Check if users table exists, if not create them
    try {
      const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()
      if (!result) {
        // Tables don't exist, create them
        const { execSync } = require("child_process")
        execSync("node scripts/create-tables.js", { stdio: "ignore", cwd: process.cwd() })
        console.log("[DB] Tables created automatically")
      }
    } catch (error: any) {
      // Table doesn't exist or error, try to create
      try {
        const { execSync } = require("child_process")
        execSync("node scripts/create-tables.js", { stdio: "ignore", cwd: process.cwd() })
        console.log("[DB] Tables created automatically")
      } catch {
        // Silently fail - tables will be created on next init-db run
      }
    }
  }
}

export { db, schema }

