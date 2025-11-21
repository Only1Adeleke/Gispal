import { Suspense } from "react"
import { AdminMixesTable } from "@/components/admin/mixes-table"
import { db } from "@/lib/db"

interface AdminMixesPageProps {
  searchParams: {
    page?: string
    limit?: string
    search?: string
    source?: string
  }
}

export default async function AdminMixesPage({ searchParams }: AdminMixesPageProps) {
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "10")
  const search = searchParams.search || ""
  const source = searchParams.source || ""

  // Fetch data directly from database
  const mixes = await db.mixes.findAll()
  const allUsers = await db.users.findAll()

  // Add user email and source to each mix
  let mixesWithUsers = mixes.map((mix) => {
    const user = allUsers.find((u) => u.id === mix.userId)
    const sourceType =
      mix.audioUrl?.includes("youtube.com") || mix.audioUrl?.includes("youtu.be")
        ? "youtube"
        : mix.audioUrl?.includes("audiomack.com")
        ? "audiomack"
        : "upload"
    return {
      ...mix,
      createdAt: mix.createdAt.toISOString(),
      userEmail: user?.email || "Unknown",
      userPlan: user?.plan || "free",
      source: sourceType,
    }
  })

  // Apply filters
  if (source && source !== "all") {
    mixesWithUsers = mixesWithUsers.filter((mix: any) => mix.source === source)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    mixesWithUsers = mixesWithUsers.filter(
      (mix: any) =>
        mix.userEmail.toLowerCase().includes(searchLower) ||
        mix.audioUrl?.toLowerCase().includes(searchLower)
    )
  }

  // Pagination
  const total = mixesWithUsers.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedMixes = mixesWithUsers.slice(start, end)

  const data = {
    data: paginatedMixes,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mixes</h1>
        <p className="text-muted-foreground">
          View all audio mixes created by users
        </p>
      </div>

      <Suspense fallback={<div>Loading mixes...</div>}>
        <AdminMixesTable
          initialMixes={data.data}
          initialPagination={data.pagination}
          initialSearch={search}
          initialSource={source}
        />
      </Suspense>
    </div>
  )
}
