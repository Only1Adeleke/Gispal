"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminSidebar } from "./admin-sidebar"
import { Skeleton } from "@/components/ui/skeleton"

async function fetchSession() {
  try {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

export function AdminSidebarWrapper() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background p-4">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  const userData = session?.user
    ? {
        name: session.user.name || "Admin",
        email: session.user.email || "admin@example.com",
        avatar: session.user.image,
      }
    : {
        name: "Admin",
        email: "admin@example.com",
        avatar: undefined,
      }

  return <AdminSidebar user={userData} />
}

