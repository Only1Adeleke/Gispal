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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, Eye, ArrowUp, Ban, Trash2, Shield, Search } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AdminUsersTableProps {
  initialUsers: any[]
  initialPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  initialSearch: string
  initialRole: string
  initialPlan: string
  initialBanned: string
}

export function AdminUsersTable({
  initialUsers,
  initialPagination,
  initialSearch,
  initialRole,
  initialPlan,
  initialBanned,
}: AdminUsersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = React.useState(initialUsers)
  const [pagination, setPagination] = React.useState(initialPagination)
  const [search, setSearch] = React.useState(initialSearch)
  const [role, setRole] = React.useState(initialRole || "")
  const [plan, setPlan] = React.useState(initialPlan || "")
  const [banned, setBanned] = React.useState(initialBanned || "")
  const [selectedUser, setSelectedUser] = React.useState<any>(null)
  const [userDetails, setUserDetails] = React.useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [detailsLoading, setDetailsLoading] = React.useState(false)

  // Update URL and refetch when filters change
  const updateFilters = React.useCallback(
    (updates: {
      search?: string
      role?: string
      plan?: string
      banned?: string
      page?: number
    }) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (updates.search !== undefined) {
        if (updates.search) params.set("search", updates.search)
        else params.delete("search")
        params.set("page", "1") // Reset to first page on search
      }
      
      if (updates.role !== undefined) {
        if (updates.role) params.set("role", updates.role)
        else params.delete("role")
        params.set("page", "1")
      }
      
      if (updates.plan !== undefined) {
        if (updates.plan) params.set("plan", updates.plan)
        else params.delete("plan")
        params.set("page", "1")
      }
      
      if (updates.banned !== undefined) {
        if (updates.banned) params.set("banned", updates.banned)
        else params.delete("banned")
        params.set("page", "1")
      }
      
      if (updates.page !== undefined) {
        if (updates.page > 1) params.set("page", updates.page.toString())
        else params.delete("page")
      }

      router.push(`/admin/users?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    updateFilters({ search: value })
  }

  const handleUpgrade = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user/${userId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "monthly_unlimited",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upgrade user")
      }

      const updated = await response.json()
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
      toast.success("User upgraded to Pro")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade user")
    } finally {
      setLoading(false)
    }
  }

  const handleDowngrade = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "free",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to downgrade user")
      }

      const updated = await response.json()
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
      toast.success("User downgraded to Free")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to downgrade user")
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (userId: string, ban: boolean = true) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: ban,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${ban ? "ban" : "unban"} user`)
      }

      const updated = await response.json()
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
      toast.success(`User ${ban ? "banned" : "unbanned"}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || `Failed to ${ban ? "ban" : "unban"} user`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (userId: string) => {
    setDetailsLoading(true)
    setDetailsDialogOpen(true)
    try {
      const response = await fetch(`/api/admin/user/${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch user details")
      }
      const data = await response.json()
      setUserDetails(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load user details")
      setDetailsDialogOpen(false)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleMakeAdmin = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: "admin",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to make user admin")
      }

      const updated = await response.json()
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
      toast.success("User made admin")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to make user admin")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user/${userId}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      setUsers(users.filter((u) => u.id !== userId))
      toast.success("User deleted")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, plans, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={role || "all"} onValueChange={(value) => updateFilters({ role: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={plan || "all"} onValueChange={(value) => updateFilters({ plan: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="monthly_unlimited">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={!banned || banned === "" ? "all" : banned} 
              onValueChange={(value) => updateFilters({ banned: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mixes</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "free" ? "secondary" : "default"}>
                        {user.plan === "free" ? "Free" : "Pro"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "destructive" : "default"}>
                        {user.banned ? "Banned" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.mixesCount || 0}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {user.plan === "free" ? (
                            <DropdownMenuItem onClick={() => handleUpgrade(user.id)}>
                              <ArrowUp className="mr-2 h-4 w-4" />
                              Upgrade to Pro
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleDowngrade(user.id)}>
                              <ArrowUp className="mr-2 h-4 w-4 rotate-180" />
                              Downgrade to Free
                            </DropdownMenuItem>
                          )}
                          {user.role !== "admin" && (
                            <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.banned ? (
                            <DropdownMenuItem onClick={() => handleBan(user.id, false)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleBan(user.id, true)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          ? `/admin/users?page=${pagination.page - 1}${search ? `&search=${search}` : ""}${role ? `&role=${role}` : ""}${plan ? `&plan=${plan}` : ""}${banned ? `&banned=${banned}` : ""}`
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
                            href={`/admin/users?page=${pageNum}${search ? `&search=${search}` : ""}${role ? `&role=${role}` : ""}${plan ? `&plan=${plan}` : ""}${banned ? `&banned=${banned}` : ""}`}
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
                          ? `/admin/users?page=${pagination.page + 1}${search ? `&search=${search}` : ""}${role ? `&role=${role}` : ""}${plan ? `&plan=${plan}` : ""}${banned ? `&banned=${banned}` : ""}`
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
                {pagination.total} users
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleDelete(selectedUser.id)}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about {userDetails?.email || "this user"}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium">{userDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{userDetails.name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plan</label>
                  <Badge variant={userDetails.plan === "free" ? "secondary" : "default"}>
                    {userDetails.plan === "free" ? "Free" : "Pro"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant={userDetails.role === "admin" ? "default" : "outline"}>
                    {userDetails.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={userDetails.banned ? "destructive" : "default"}>
                    {userDetails.banned ? "Banned" : "Active"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                  <p className="text-sm font-medium">
                    {format(new Date(userDetails.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              {userDetails.stats && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jingles</label>
                      <p className="text-sm font-medium">{userDetails.stats.jingles}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cover Arts</label>
                      <p className="text-sm font-medium">{userDetails.stats.coverArts}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mixes</label>
                      <p className="text-sm font-medium">{userDetails.stats.mixes}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Mixes</label>
                      <p className="text-sm font-medium">{userDetails.stats.totalMixes}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Uploads</label>
                      <p className="text-sm font-medium">{userDetails.stats.totalUploads}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Downloads</label>
                      <p className="text-sm font-medium">{userDetails.stats.totalDownloads}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
