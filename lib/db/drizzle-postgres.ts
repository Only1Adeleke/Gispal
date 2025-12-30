/**
 * Drizzle ORM database connection for PostgreSQL
 * Production-ready connection with connection pooling
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema-postgres"

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required for PostgreSQL")
}

// Create postgres connection with connection pooling
// Connection pool settings for production
const connectionString = databaseUrl
const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10)

const client = postgres(connectionString, {
  max: maxConnections,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for use in migrations
export { schema }

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

