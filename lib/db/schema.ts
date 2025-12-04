/**
 * Drizzle ORM Schema
 * Defines database tables and relations
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { randomUUID } from "crypto"

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  apiKey: text("api_key"),
  apiKeyCreatedAt: integer("api_key_created_at", { mode: "timestamp" }),
  plan: text("plan", {
    enum: [
      "free",
      "daily_unlimited",
      "daily_250mb",
      "weekly_unlimited",
      "weekly_300mb",
      "monthly_unlimited",
      "monthly_5000mb",
    ],
  })
    .notNull()
    .default("free"),
  planExpiresAt: integer("plan_expires_at", { mode: "timestamp" }),
  bandwidthUsed: integer("bandwidth_used").notNull().default(0), // in bytes
  bandwidthLimit: integer("bandwidth_limit").notNull().default(100 * 1024 * 1024), // 100MB default
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  banned: integer("banned", { mode: "boolean" }).notNull().default(false),
})

// Jingles table
export const jingles = sqliteTable("jingles", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  duration: integer("duration"), // in seconds
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Cover arts table
export const coverArts = sqliteTable("cover_arts", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Mixes table
export const mixes = sqliteTable("mixes", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  audioUrl: text("audio_url").notNull(),
  jingleId: text("jingle_id").references(() => jingles.id, { onDelete: "set null" }),
  coverArtId: text("cover_art_id").references(() => coverArts.id, { onDelete: "set null" }),
  position: text("position", { enum: ["start", "middle", "end"] }).notNull(),
  outputUrl: text("output_url").notNull(),
  isPreview: integer("is_preview", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Audio table
export const audios = sqliteTable("audios", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  title: text("title").notNull(),
  tags: text("tags"),
  url: text("url").notNull(),
  duration: integer("duration"), // in seconds
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  parentId: text("parent_id"), // ID of the original audio if this is a mixed version (self-reference handled in relations)
  artist: text("artist"),
  album: text("album"),
  producer: text("producer"),
  year: text("year"),
  coverArt: text("cover_art"), // Path to cover art: /storage/cover-art/{userId}/{uuid}.jpg
})

// API keys table
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(), // SHA-256 hash of the API key
    name: text("name").notNull(), // User-friendly name for the key
    scopes: text("scopes", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]), // JSON array of scopes
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    deletedAt: integer("deleted_at", { mode: "timestamp" }), // Soft delete
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }), // Optional expiration
    revokedAt: integer("revoked_at", { mode: "timestamp" }), // Revocation timestamp
    rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
    rateLimitPerDay: integer("rate_limit_per_day").notNull().default(5000),
  },
  (table) => [
    index("api_keys_key_hash_idx").on(table.keyHash), // Index for fast lookup
    index("api_keys_user_id_idx").on(table.userId),
    index("api_keys_deleted_at_idx").on(table.deletedAt),
  ]
)

// API key usages table
export const apiKeyUsages = sqliteTable(
  "api_key_usages",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    route: text("route").notNull(), // API route that was called
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: integer("success", { mode: "boolean" }).notNull().default(true),
    latencyMs: integer("latency_ms"), // Response latency in milliseconds
    deletedAt: integer("deleted_at", { mode: "timestamp" }), // Soft delete
  },
  (table) => [
    index("api_key_usages_api_key_id_idx").on(table.apiKeyId),
    index("api_key_usages_timestamp_idx").on(table.timestamp),
    index("api_key_usages_route_idx").on(table.route),
  ]
)

// Usage table
export const usage = sqliteTable("usage", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  totalMixes: integer("total_mixes").notNull().default(0),
  totalUploads: integer("total_uploads").notNull().default(0),
  totalDownloads: integer("total_downloads").notNull().default(0),
  wordpressApiRequests: integer("wordpress_api_requests").notNull().default(0),
  history: text("history", { mode: "json" }).$type<Array<{ type: string; timestamp: number; meta?: any }>>().default([]),
})

// Staging table
export const staging = sqliteTable("staging", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  filename: text("filename").notNull(),
  duration: integer("duration"), // in seconds
  extractedCoverArt: text("extracted_cover_art"),
  extractedMetadata: text("extracted_metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Audiomack tokens table
export const audiomackTokens = sqliteTable("audiomack_tokens", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(), // Encrypted
  accessTokenSecret: text("access_token_secret").notNull(), // Encrypted
  expiresAt: integer("expires_at"), // UNIX timestamp
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  jingles: many(jingles),
  coverArts: many(coverArts),
  mixes: many(mixes),
  apiKeys: many(apiKeys),
  apiKeyUsages: many(apiKeyUsages),
  usage: many(usage),
  staging: many(staging),
  audiomackToken: many(audiomackTokens),
}))

export const jinglesRelations = relations(jingles, ({ one, many }) => ({
  user: one(users, {
    fields: [jingles.userId],
    references: [users.id],
  }),
  mixes: many(mixes),
}))

export const coverArtsRelations = relations(coverArts, ({ one, many }) => ({
  user: one(users, {
    fields: [coverArts.userId],
    references: [users.id],
  }),
  mixes: many(mixes),
}))

export const mixesRelations = relations(mixes, ({ one }) => ({
  user: one(users, {
    fields: [mixes.userId],
    references: [users.id],
  }),
  jingle: one(jingles, {
    fields: [mixes.jingleId],
    references: [jingles.id],
  }),
  coverArt: one(coverArts, {
    fields: [mixes.coverArtId],
    references: [coverArts.id],
  }),
}))

export const audiosRelations = relations(audios, ({ one, many }) => ({
  parent: one(audios, {
    fields: [audios.parentId],
    references: [audios.id],
    relationName: "parent",
  }),
  children: many(audios, {
    relationName: "parent",
  }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  usages: many(apiKeyUsages),
}))

export const apiKeyUsagesRelations = relations(apiKeyUsages, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsages.apiKeyId],
    references: [apiKeys.id],
  }),
}))

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(users, {
    fields: [usage.userId],
    references: [users.id],
  }),
}))

export const stagingRelations = relations(staging, ({ one }) => ({
  user: one(users, {
    fields: [staging.userId],
    references: [users.id],
  }),
}))

export const audiomackTokensRelations = relations(audiomackTokens, ({ one }) => ({
  user: one(users, {
    fields: [audiomackTokens.userId],
    references: [users.id],
  }),
}))

