import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = await db.users.findById(session.user.id)
  
  if (!user || user.role !== "admin" || user.banned) {
    redirect("/dashboard")
  }

  return { session, user }
}

