import { Suspense } from "react"
import { AdminUsersTable } from "@/components/admin/users-table"
import { db } from "@/lib/db"

interface AdminUsersPageProps {
  searchParams: {
    page?: string
    limit?: string
    search?: string
    role?: string
    plan?: string
    banned?: string
  }
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "10")
  const search = searchParams.search || ""
  const role = searchParams.role || ""
  const plan = searchParams.plan || ""
  const banned = searchParams.banned || ""

  // Fetch and filter data directly from database
  let users = await db.users.findAll()
  const allMixes = await db.mixes.findAll()

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase()
    users = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
    )
  }

  if (role) {
    users = users.filter((user) => user.role === role)
  }

  if (plan) {
    users = users.filter((user) => user.plan === plan)
  }

  if (banned === "true") {
    users = users.filter((user) => user.banned === true)
  } else if (banned === "false") {
    users = users.filter((user) => user.banned === false)
  }

  // Calculate mixes count
  const mixesCount: Record<string, number> = {}
  allMixes.forEach((mix) => {
    mixesCount[mix.userId] = (mixesCount[mix.userId] || 0) + 1
  })

  const usersWithStats = users.map((user) => ({
    ...user,
    mixesCount: mixesCount[user.id] || 0,
  }))

  // Pagination
  const total = usersWithStats.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedUsers = usersWithStats.slice(start, end)

  const data = {
    data: paginatedUsers,
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
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all platform users
        </p>
      </div>

      <Suspense fallback={<div>Loading users...</div>}>
        <AdminUsersTable
          initialUsers={data.data}
          initialPagination={data.pagination}
          initialSearch={search}
          initialRole={role}
          initialPlan={plan}
          initialBanned={banned}
        />
      </Suspense>
    </div>
  )
}
