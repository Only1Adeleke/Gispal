/**
 * Drizzle ORM database connection
 * Server-side only - safe for SSR
 */

import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import * as schema from "./schema"

// Ensure database directory exists
const dbPath = path.join(process.cwd(), "drizzle.db")

// Create database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  const tempDb = new Database(dbPath)
  tempDb.close()
}

// Initialize SQLite database
const sqlite = new Database(dbPath)

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema })

// Export schema for use in migrations
export { schema }

