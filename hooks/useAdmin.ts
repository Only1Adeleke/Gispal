"use client"

import { useQuery } from "@tanstack/react-query"

async function checkAdmin(): Promise<boolean> {
  // Check if user is admin
  // This will be verified on the server side
  const response = await fetch("/api/auth/check-admin")
  if (!response.ok) return false
  const data = await response.json()
  return data.isAdmin === true
}

export function useAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

