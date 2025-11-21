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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Eye, Trash2, Search } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AdminMixesTableProps {
  initialMixes: Array<{
    id: string
    userId: string
    audioUrl: string
    jingleId?: string
    coverArtId?: string
    position: "start" | "middle" | "end"
    outputUrl: string
    isPreview: boolean
    createdAt: string
    userEmail: string
    userPlan: string
    source: string
  }>
  initialPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  initialSearch: string
  initialSource: string
}

export function AdminMixesTable({
  initialMixes,
  initialPagination,
  initialSearch,
  initialSource,
}: AdminMixesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mixes, setMixes] = React.useState(initialMixes)
  const [pagination, setPagination] = React.useState(initialPagination)
  const [search, setSearch] = React.useState(initialSearch)
  const [source, setSource] = React.useState(initialSource || "all")
  const [selectedMix, setSelectedMix] = React.useState<any>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Update URL and refetch when filters change
  const updateFilters = React.useCallback(
    (updates: { search?: string; source?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.search !== undefined) {
        if (updates.search) params.set("search", updates.search)
        else params.delete("search")
        params.set("page", "1")
      }

      if (updates.source !== undefined) {
        if (updates.source && updates.source !== "all") {
          params.set("source", updates.source)
        } else {
          params.delete("source")
        }
        params.set("page", "1")
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) params.set("page", updates.page.toString())
        else params.delete("page")
      }

      router.push(`/admin/mixes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    updateFilters({ search: value })
  }

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case "youtube":
        return "YouTube"
      case "audiomack":
        return "Audiomack"
      case "upload":
        return "Upload"
      default:
        return sourceType
    }
  }

  const handleDelete = async (mixId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/mixes?mixId=${mixId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete mix")
      }

      setMixes(mixes.filter((m) => m.id !== mixId))
      toast.success("Mix deleted")
      setDeleteDialogOpen(false)
      setSelectedMix(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete mix")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Mixes</CardTitle>
          <CardDescription>
            View all audio mixes created by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email or URL..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={source}
              onValueChange={(value) => {
                setSource(value)
                updateFilters({ source: value })
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="audiomack">Audiomack</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mixes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No mixes found
                  </TableCell>
                </TableRow>
              ) : (
                mixes.map((mix) => (
                  <TableRow key={mix.id}>
                    <TableCell>{mix.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getSourceLabel(mix.source)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mix.userPlan === "free" ? "secondary" : "default"}>
                        {mix.userPlan === "free" ? "Free" : "Pro"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mix.isPreview ? "secondary" : "default"}>
                        {mix.isPreview ? "Preview" : "Full"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(mix.createdAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMix(mix)
                            setDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMix(mix)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                          ? `/admin/mixes?page=${pagination.page - 1}${search ? `&search=${search}` : ""}${source && source !== "all" ? `&source=${source}` : ""}`
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
                            href={`/admin/mixes?page=${pageNum}${search ? `&search=${search}` : ""}${source && source !== "all" ? `&source=${source}` : ""}`}
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
                          ? `/admin/mixes?page=${pagination.page + 1}${search ? `&search=${search}` : ""}${source && source !== "all" ? `&source=${source}` : ""}`
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
                {pagination.total} mixes
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mix Details</DialogTitle>
            <DialogDescription>
              Detailed information about this mix
            </DialogDescription>
          </DialogHeader>
          {selectedMix && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMix.userEmail}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Source</p>
                <p className="text-sm text-muted-foreground">
                  {getSourceLabel(selectedMix.source)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Audio URL</p>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedMix.audioUrl}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Output URL</p>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedMix.outputUrl}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedMix.createdAt), "PPpp")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mix</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mix? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMix && handleDelete(selectedMix.id)}
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
