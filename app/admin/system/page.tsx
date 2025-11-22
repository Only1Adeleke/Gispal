import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

// Dynamic import for client component
const AdminSystemOverview = dynamic(() => import("@/components/admin/system-overview").then(mod => ({ default: mod.AdminSystemOverview })), {
  ssr: false,
})

export default async function AdminSystemPage() {
  const jingles = await db.jingles.findAll()
  const coverArts = await db.coverArts.findAll()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System</h1>
        <p className="text-muted-foreground">
          Monitor system health, storage, and logs
        </p>
      </div>

      <Suspense fallback={<div>Loading system info...</div>}>
        <AdminSystemOverview jingles={jingles} coverArts={coverArts} />
      </Suspense>
    </div>
  )
}

