/**
 * API Key utilities for generation, hashing, and validation
 */

import crypto from "crypto"

/**
 * Generate a secure, random API key
 * Format: gispal_<random-base64-url-safe>
 * Length: 36-48 characters
 * Returns both the full key and the prefix for display
 */
export function generateApiKey(): { key: string; prefix: string } {
  // Generate 32 random bytes (256 bits) and encode as base64url
  const randomBytes = crypto.randomBytes(32)
  const base64Key = randomBytes.toString("base64url")
  // Prefix with "gispal_" for identification
  const fullKey = `gispal_${base64Key}`
  // Extract prefix (first 8-10 characters for display)
  const prefix = fullKey.substring(0, Math.min(10, fullKey.length))
  return { key: fullKey, prefix }
}

/**
 * Extract prefix from an API key
 * Returns first 6-10 characters for display purposes
 */
export function extractPrefix(key: string): string {
  return key.substring(0, Math.min(10, key.length))
}

/**
 * Hash an API key using SHA-256
 * This is what we store in the database
 */
export async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash("sha256").update(key).digest("hex")
}

/**
 * Synchronous version of hashApiKey for use in non-async contexts
 */
export function hashApiKeySync(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

/**
 * Validate API key format
 * Must start with "gispal_" and be at least 36 characters
 */
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith("gispal_") && key.length >= 36 && key.length <= 60
}

/**
 * Base API scopes
 */
export const API_SCOPES = {
  AUDIO_INGEST: "audio:ingest",
  AUDIO_MIX: "audio:mix",
  AUDIOMACK_DOWNLOAD: "audiomack:download",
  WORKFLOW_RUN: "workflow:run",
  PROJECT_READ: "project:read",
  PROJECT_WRITE: "project:write",
} as const

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES]

export const ALL_SCOPES = Object.values(API_SCOPES)

/**
 * Validate that required scopes are present in the key's scopes
 */
export function hasRequiredScopes(keyScopes: string[], requiredScopes: string[]): boolean {
  return requiredScopes.every((scope) => keyScopes.includes(scope))
}

