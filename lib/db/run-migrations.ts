/**
 * Database Migration Runner
 * Runs Drizzle migrations for both SQLite and Postgres
 * Can be called from Node.js scripts or during server startup
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator"
import Database from "better-sqlite3"
import postgres from "postgres"
import path from "path"
import fs from "fs"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"

const databaseUrl = process.env.DATABASE_URL
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("pg://")
)

async function runMigrations() {
  try {
    if (isPostgres) {
      console.log("[MIGRATIONS] Running PostgreSQL migrations...")
      
      const client = postgres(databaseUrl!, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      })
      
      const db = drizzlePostgres(client)
      
      // Run migrations
      await migratePostgres(db, {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      })
      
      await client.end()
      console.log("[MIGRATIONS] PostgreSQL migrations completed successfully")
    } else {
      console.log("[MIGRATIONS] Running SQLite migrations...")
      
      const dbPath = path.join(process.cwd(), "drizzle.db")
      
      // Create database file if it doesn't exist
      if (!fs.existsSync(dbPath)) {
        const tempDb = new Database(dbPath)
        tempDb.close()
        console.log("[MIGRATIONS] Created drizzle.db file")
      }
      
      const sqlite = new Database(dbPath)
      const db = drizzle(sqlite)
      
      // Ensure migrations folder exists
      const migrationsFolder = path.join(process.cwd(), "drizzle")
      if (!fs.existsSync(migrationsFolder)) {
        fs.mkdirSync(migrationsFolder, { recursive: true })
        console.log("[MIGRATIONS] Created drizzle migrations folder")
      }
      
      // Run migrations
      migrate(db, {
        migrationsFolder: migrationsFolder,
      })
      
      sqlite.close()
      console.log("[MIGRATIONS] SQLite migrations completed successfully")
    }
  } catch (error: any) {
    console.error("[MIGRATIONS] Error running migrations:", error)
    throw error
  }
}

// If called directly (not imported)
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("[MIGRATIONS] All migrations completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("[MIGRATIONS] Migration failed:", error)
      process.exit(1)
    })
}

export { runMigrations }

