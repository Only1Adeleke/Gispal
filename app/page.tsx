import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function Home() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (session && session.user) {
      // Check if user is admin and redirect accordingly
      const user = await db.users.findById(session.user.id)
      if (user && user.role === "admin") {
        redirect("/admin")
      } else {
        redirect("/dashboard")
      }
    }
  } catch (error) {
    console.error("Home page session check error:", error)
    // If session check fails, redirect to login
  }
  
  redirect("/login")
}

