/**
 * Drizzle ORM Schema for PostgreSQL
 * Production-ready schema with all required fields
 */

import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { randomUUID } from "crypto"

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  apiKey: text("api_key"),
  apiKeyCreatedAt: timestamp("api_key_created_at"),
  plan: varchar("plan", { length: 50 })
    .notNull()
    .default("free"),
  planExpiresAt: timestamp("plan_expires_at"),
  bandwidthUsed: integer("bandwidth_used").notNull().default(0),
  bandwidthLimit: integer("bandwidth_limit").notNull().default(100 * 1024 * 1024),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  isAdmin: boolean("is_admin").notNull().default(false), // Explicit admin flag
  banned: boolean("banned").notNull().default(false),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}))

// API keys table - Enhanced with all required fields
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(), // SHA-256 hash of the API key
    prefix: varchar("prefix", { length: 10 }).notNull(), // First 6-10 chars for display
    name: varchar("name", { length: 255 }).notNull(), // User-friendly name
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]), // JSON array of scopes
    expiresAt: timestamp("expires_at"), // Optional expiration
    lastUsedAt: timestamp("last_used_at"),
    usageCount: integer("usage_count").notNull().default(0), // Total usage counter
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete
    revokedAt: timestamp("revoked_at"), // Revocation timestamp
    rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
    rateLimitPerDay: integer("rate_limit_per_day").notNull().default(1000),
  },
  (table) => ({
    keyHashIdx: uniqueIndex("api_keys_key_hash_idx").on(table.keyHash),
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    deletedAtIdx: index("api_keys_deleted_at_idx").on(table.deletedAt),
    prefixIdx: index("api_keys_prefix_idx").on(table.prefix),
  })
)

// API key usages table
export const apiKeyUsages = pgTable(
  "api_key_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    route: varchar("route", { length: 500 }).notNull(), // API route that was called
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
    userAgent: text("user_agent"),
    success: boolean("success").notNull().default(true),
    latencyMs: integer("latency_ms"), // Response latency in milliseconds
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete
  },
  (table) => ({
    apiKeyIdIdx: index("api_key_usages_api_key_id_idx").on(table.apiKeyId),
    timestampIdx: index("api_key_usages_created_at_idx").on(table.createdAt),
    routeIdx: index("api_key_usages_route_idx").on(table.route),
    deletedAtIdx: index("api_key_usages_deleted_at_idx").on(table.deletedAt),
  })
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
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

// Payment plans table
export const paymentPlans = pgTable("payment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceNgn: integer("price_ngn").notNull().default(0),
  rateLimitPerMin: integer("rate_limit_per_min").notNull().default(60),
  rateLimitPerDay: integer("rate_limit_per_day").notNull().default(1000),
  raenestLink: text("raenest_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// User subscriptions table
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").notNull().references(() => paymentPlans.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    raenestPaymentId: varchar("raenest_payment_id", { length: 255 }),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
    planIdIdx: index("user_subscriptions_plan_id_idx").on(table.planId),
    statusIdx: index("user_subscriptions_status_idx").on(table.status),
  })
)

export const paymentPlansRelations = relations(paymentPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}))

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(paymentPlans, {
    fields: [userSubscriptions.planId],
    references: [paymentPlans.id],
  }),
}))

