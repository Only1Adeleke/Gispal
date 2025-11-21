"use client"

import { createAuthClient } from "better-auth/react"

// Client baseURL should point to the app root, not the auth endpoint
// Better Auth client will automatically append /api/auth
const baseURL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL: baseURL,
})

export const { signIn, signUp, signOut, useSession } = authClient

