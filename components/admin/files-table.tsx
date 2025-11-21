"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Trash2, Search } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AdminFilesTableProps {
  initialFiles: Array<{
    id: string
    type: "jingle" | "cover-art" | "audio"
    userId: string
    name: string
    size: number
    url: string
    createdAt: string
    expiresAt: string | null
    userEmail: string
  }>
  initialPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  initialSearch: string
  initialFileType: string
}

export function AdminFilesTable({
  initialFiles,
  initialPagination,
  initialSearch,
  initialFileType,
}: AdminFilesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [files, setFiles] = React.useState(initialFiles)
  const [pagination, setPagination] = React.useState(initialPagination)
  const [search, setSearch] = React.useState(initialSearch)
  const [fileType, setFileType] = React.useState(initialFileType || "all")
  const [selectedFile, setSelectedFile] = React.useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Update URL and refetch when filters change
  const updateFilters = React.useCallback(
    (updates: { search?: string; fileType?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.search !== undefined) {
        if (updates.search) params.set("search", updates.search)
        else params.delete("search")
        params.set("page", "1")
      }

      if (updates.fileType !== undefined) {
        if (updates.fileType && updates.fileType !== "all") {
          params.set("fileType", updates.fileType)
        } else {
          params.delete("fileType")
        }
        params.set("page", "1")
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) params.set("page", updates.page.toString())
        else params.delete("page")
      }

      router.push(`/admin/files?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    updateFilters({ search: value })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleDelete = async (fileId: string, fileType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/files?fileId=${fileId}&fileType=${fileType}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }

      setFiles(files.filter((f) => f.id !== fileId))
      toast.success("File deleted")
      setDeleteDialogOpen(false)
      setSelectedFile(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>
            View and manage all uploaded files across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={fileType}
              onValueChange={(value) => {
                setFileType(value)
                updateFilters({ fileType: value })
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="jingle">Jingles</SelectItem>
                <SelectItem value="cover-art">Cover Arts</SelectItem>
                <SelectItem value="audio">Audio Files</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No files found
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {file.type === "jingle"
                          ? "Jingle"
                          : file.type === "cover-art"
                          ? "Cover Art"
                          : "Audio"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.userEmail}</TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>
                      {format(new Date(file.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {file.expiresAt
                        ? format(new Date(file.expiresAt), "MMM dd, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(file)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        pagination.page > 1
                          ? `/admin/files?page=${pagination.page - 1}${search ? `&search=${search}` : ""}${fileType && fileType !== "all" ? `&fileType=${fileType}` : ""}`
                          : "#"
                      }
                      className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href={`/admin/files?page=${pageNum}${search ? `&search=${search}` : ""}${fileType && fileType !== "all" ? `&fileType=${fileType}` : ""}`}
                            isActive={pageNum === pagination.page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href={
                        pagination.page < pagination.totalPages
                          ? `/admin/files?page=${pagination.page + 1}${search ? `&search=${search}` : ""}${fileType && fileType !== "all" ? `&fileType=${fileType}` : ""}`
                          : "#"
                      }
                      className={
                        pagination.page >= pagination.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-sm text-muted-foreground text-center mt-2">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} files
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFile?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedFile && handleDelete(selectedFile.id, selectedFile.type)
              }
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
