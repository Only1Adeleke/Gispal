import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

/**
 * Require admin access - throws redirect if not admin
 * Use this in server components/pages
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || !session.user) {
    redirect("/login")
  }

  const user = await db.users.findById(session.user.id)
  
  if (!user || user.role !== "admin" || user.banned) {
    redirect("/dashboard")
  }

  return { session, user }
}

/**
 * Check admin access without redirecting - returns null if not admin
 * Use this in API routes
 */
export async function checkAdmin() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || !session.user) {
      return null
    }

    const user = await db.users.findById(session.user.id)
    
    if (!user || user.role !== "admin" || user.banned) {
      return null
    }

    return { session, user }
  } catch (error) {
    return null
  }
}

