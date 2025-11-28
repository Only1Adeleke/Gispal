export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { betterAuth } from "better-auth"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

let auth: ReturnType<typeof betterAuth>

try {
  // Ensure database directory exists
  const dbPath = path.join(process.cwd(), "sqlite.db")

  // Create database file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    const db = new Database(dbPath)
    db.close()
  }

  // Initialize SQLite database
  const sqlite = new Database(dbPath)

  // Get base URL - should be the full URL to the auth API endpoint
  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const authBaseURL = `${baseURL}/api/auth`

  // Create Better Auth instance with SQLite
  auth = betterAuth({
    database: sqlite,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false, // Disable for development
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
      },
    },
    secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
    baseURL: authBaseURL,
    trustedOrigins: [
      "http://localhost:3000",
      baseURL,
    ],
    advanced: {
      cookiePrefix: "",
      generateId: () => crypto.randomUUID(),
    },
  })
} catch (error) {
  console.error("Failed to initialize Better Auth:", error)
  // Create a minimal auth instance that won't crash
  auth = betterAuth({
    database: {} as any,
    secret: "dev-secret-change-in-production",
    baseURL: "http://localhost:3000/api/auth",
  })
}

export { auth }

/**
 * Get session from NextRequest - for use in API routes
 * This is a convenience wrapper around auth.api.getSession
 */
export async function getSession(request: NextRequest) {
  try {
    // NextRequest.headers is compatible with Headers for Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    return session
  } catch (error) {
    console.error("[AUTH] Error getting session:", error)
    return null
  }
}

