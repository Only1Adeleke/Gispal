import { Suspense } from "react"
import { AdminFilesTable } from "@/components/admin/files-table"
import { db } from "@/lib/db"

interface AdminFilesPageProps {
  searchParams: {
    page?: string
    limit?: string
    search?: string
    fileType?: string
  }
}

export default async function AdminFilesPage({ searchParams }: AdminFilesPageProps) {
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "10")
  const search = searchParams.search || ""
  const fileType = searchParams.fileType || ""

  // Fetch data directly from database
  const jingles = await db.jingles.findAll()
  const coverArts = await db.coverArts.findAll()
  const allUsers = await db.users.findAll()

  let files = [
    ...jingles.map((j) => ({
      id: j.id,
      type: "jingle" as const,
      userId: j.userId,
      name: j.name,
      size: j.fileSize,
      url: j.fileUrl,
      createdAt: j.createdAt.toISOString(),
      expiresAt: null as string | null,
      userEmail: allUsers.find((u) => u.id === j.userId)?.email || "Unknown",
    })),
    ...coverArts.map((c) => ({
      id: c.id,
      type: "cover-art" as const,
      userId: c.userId,
      name: c.name,
      size: c.fileSize,
      url: c.fileUrl,
      createdAt: c.createdAt.toISOString(),
      expiresAt: null as string | null,
      userEmail: allUsers.find((u) => u.id === c.userId)?.email || "Unknown",
    })),
  ]

  // Apply filters
  if (fileType && fileType !== "all") {
    files = files.filter((file) => file.type === fileType)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    files = files.filter(
      (file) =>
        file.name.toLowerCase().includes(searchLower) ||
        file.userEmail.toLowerCase().includes(searchLower)
    )
  }

  // Pagination
  const total = files.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedFiles = files.slice(start, end)

  const data = {
    data: paginatedFiles,
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
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-muted-foreground">
          Manage all uploaded files (jingles, cover arts, and temporary files)
        </p>
      </div>

      <Suspense fallback={<div>Loading files...</div>}>
        <AdminFilesTable
          initialFiles={data.data}
          initialPagination={data.pagination}
          initialSearch={search}
          initialFileType={fileType}
        />
      </Suspense>
    </div>
  )
}
