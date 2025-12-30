/**
 * Database Initialization
 * Creates tables and seeds data on startup (dev mode only)
 */

import { createTables } from "./create-tables"
import { seedDatabase } from "./seed"

let initialized = false

export async function initializeDatabase() {
  // Only run in development and only once
  if (initialized || process.env.NODE_ENV === "production") {
    return
  }
  
  // Skip if DATABASE_URL is set (production)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
    console.log("[DB-INIT] Production mode detected, skipping auto-migration")
    return
  }
  
  try {
    console.log("[DB-INIT] Initializing database...")
    
    // Create tables directly
    await createTables()
    
    // Seed database
    await seedDatabase()
    
    initialized = true
    console.log("[DB-INIT] Database initialization completed")
  } catch (error: any) {
    console.error("[DB-INIT] Database initialization failed:", error)
    // Don't throw - allow server to start even if migrations fail
    // The error will be visible in logs
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV !== "production" && typeof window === "undefined") {
  // Run asynchronously to not block module loading
  initializeDatabase().catch(console.error)
}

