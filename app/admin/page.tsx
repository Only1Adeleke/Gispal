import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { AdminStatsCards } from "@/components/admin/stats-cards"
import { AdminCharts } from "@/components/admin/charts"
import { AdminRecentUsers } from "@/components/admin/recent-users"

export default async function AdminOverviewPage() {
  // Fetch real data from database
  const allUsers = await db.users.findAll()
  const allJingles = await db.jingles.findAll()
  const allCoverArts = await db.coverArts.findAll()
  const allMixes = await db.mixes.findAll()

  const totalUsers = allUsers.length
  const activeProUsers = allUsers.filter((u: any) => 
    u.plan !== "free"
  ).length
  const totalMixes = allMixes.length
  
  // Calculate storage used (sum of all file sizes)
  const storageUsed = [
    ...allJingles.map((j: any) => j.fileSize || 0),
    ...allCoverArts.map((c: any) => c.fileSize || 0),
  ].reduce((sum, size) => sum + size, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">
          Monitor your platform&apos;s performance and user activity
        </p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <AdminStatsCards
          totalUsers={totalUsers}
          activeProUsers={activeProUsers}
          totalMixes={totalMixes}
          storageUsed={storageUsed}
        />
      </Suspense>

      {/* Charts Section */}
      <Suspense fallback={<div>Loading charts...</div>}>
        <AdminCharts
          users={allUsers}
          mixes={allMixes}
        />
      </Suspense>

      {/* Recent Users Table */}
      <Suspense fallback={<div>Loading recent users...</div>}>
        <AdminRecentUsers users={allUsers.slice(0, 10)} />
      </Suspense>
    </div>
  )
}

