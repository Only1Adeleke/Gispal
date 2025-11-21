import { Suspense } from "react"
import { AdminPlansOverview } from "@/components/admin/plans-overview"
import { db } from "@/lib/db"

// Server-side data fetching - for now return default limits
// In production, fetch from database or config
async function getPlans() {
  return {
    free: {
      jingles: 1,
      coverArts: 1,
      jinglePositions: ["start"],
      volumeControl: false,
      fullExport: false,
      previewDuration: 30,
      bandwidthLimit: 100 * 1024 * 1024,
    },
    pro: {
      jingles: Infinity,
      coverArts: Infinity,
      jinglePositions: ["start", "middle", "end"],
      volumeControl: true,
      fullExport: true,
      previewDuration: null,
      bandwidthLimit: Infinity,
    },
  }
}

export default async function AdminPlansPage() {
  const allUsers = await db.users.findAll()
  const planLimits = await getPlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="text-muted-foreground">
          Manage subscription plans and limits
        </p>
      </div>

      <Suspense fallback={<div>Loading plans...</div>}>
        <AdminPlansOverview users={allUsers} planLimits={planLimits} />
      </Suspense>
    </div>
  )
}
