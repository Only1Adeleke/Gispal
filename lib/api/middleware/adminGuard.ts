/**
 * Admin guard middleware
 * Ensures only admin users can access protected routes
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/drizzle"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return user?.role === "admin" || user?.isAdmin === true
}

/**
 * Admin guard middleware
 * Returns admin user or error response
 */
export async function adminOnly(
  request: NextRequest
): Promise<
  | { success: true; userId: string; userEmail: string }
  | { success: false; response: NextResponse }
> {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session || !session.user) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const userId = session.user.id
  const userIsAdmin = await isAdmin(userId)

  if (!userIsAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      ),
    }
  }

  return {
    success: true,
    userId,
    userEmail: session.user.email || "",
  }
}

