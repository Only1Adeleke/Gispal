import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL
const isPostgres = databaseUrl && (
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("pg://")
)

export default defineConfig({
  dialect: isPostgres ? "postgresql" : "sqlite",
  schema: isPostgres ? "./lib/db/schema-postgres.ts" : "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: isPostgres ? {
    url: databaseUrl!,
  } : {
    url: process.env.DATABASE_URL || "./drizzle.db",
  },
})
