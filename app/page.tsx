import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth.api.getSession({ headers: {} })
  
  if (session) {
    redirect("/dashboard")
  }
  
  redirect("/login")
}

