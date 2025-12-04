/**
 * Zod schemas generated from Drizzle ORM schemas using drizzle-zod
 * These can be used for API request/response validation
 */

import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod"
import {
  users,
  jingles,
  coverArts,
  mixes,
  audios,
  apiKeys,
  apiKeyUsages,
  usage,
  staging,
  audiomackTokens,
} from "./schema"

// User schemas
export const userSelectSchema = createSelectSchema(users)
export const userInsertSchema = createInsertSchema(users)
export const userUpdateSchema = createUpdateSchema(users)

// Jingle schemas
export const jingleSelectSchema = createSelectSchema(jingles)
export const jingleInsertSchema = createInsertSchema(jingles)
export const jingleUpdateSchema = createUpdateSchema(jingles)

// Cover art schemas
export const coverArtSelectSchema = createSelectSchema(coverArts)
export const coverArtInsertSchema = createInsertSchema(coverArts)
export const coverArtUpdateSchema = createUpdateSchema(coverArts)

// Mix schemas
export const mixSelectSchema = createSelectSchema(mixes)
export const mixInsertSchema = createInsertSchema(mixes)
export const mixUpdateSchema = createUpdateSchema(mixes)

// Audio schemas
export const audioSelectSchema = createSelectSchema(audios)
export const audioInsertSchema = createInsertSchema(audios)
export const audioUpdateSchema = createUpdateSchema(audios)

// API key schemas
export const apiKeySelectSchema = createSelectSchema(apiKeys)
export const apiKeyInsertSchema = createInsertSchema(apiKeys)
export const apiKeyUpdateSchema = createUpdateSchema(apiKeys)

// API key usage schemas
export const apiKeyUsageSelectSchema = createSelectSchema(apiKeyUsages)
export const apiKeyUsageInsertSchema = createInsertSchema(apiKeyUsages)
export const apiKeyUsageUpdateSchema = createUpdateSchema(apiKeyUsages)

// Usage schemas
export const usageSelectSchema = createSelectSchema(usage)
export const usageInsertSchema = createInsertSchema(usage)
export const usageUpdateSchema = createUpdateSchema(usage)

// Staging schemas
export const stagingSelectSchema = createSelectSchema(staging)
export const stagingInsertSchema = createInsertSchema(staging)
export const stagingUpdateSchema = createUpdateSchema(staging)

// Audiomack token schemas
export const audiomackTokenSelectSchema = createSelectSchema(audiomackTokens)
export const audiomackTokenInsertSchema = createInsertSchema(audiomackTokens)
export const audiomackTokenUpdateSchema = createUpdateSchema(audiomackTokens)

// Type exports removed - use z.infer<typeof schemaName> directly in consuming code
// This avoids type compatibility issues with drizzle-zod's BuildSchema type
