"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Search, RotateCcw, Trash2, Eye, Settings, Shield, Copy } from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  createdAt: Date | string
  lastUsedAt: Date | string | null
  usageCount: number
  rateLimitPerMinute: number
  rateLimitPerDay: number
  status: "active" | "revoked" | "expired"
  userId: string
  userEmail: string | null
  userName: string | null
}

async function fetchAdminApiKeys(params: {
  status?: string
  search?: string
  searchType?: string
  page?: number
  limit?: number
}): Promise<{ keys: AdminApiKey[]; pagination: any }> {
  const queryParams = new URLSearchParams()
  if (params.status) queryParams.set("status", params.status)
  if (params.search) queryParams.set("search", params.search)
  if (params.searchType) queryParams.set("searchType", params.searchType)
  if (params.page) queryParams.set("page", params.page.toString())
  if (params.limit) queryParams.set("limit", params.limit.toString())

  const response = await fetch(`/api/admin/api-keys?${queryParams.toString()}`)
  if (!response.ok) {
    throw new Error("Failed to fetch API keys")
  }
  return response.json()
}

async function forceRevokeKey(id: string): Promise<void> {
  const response = await fetch(`/api/admin/api-keys/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to revoke key")
  }
}

async function forceRotateKey(id: string): Promise<{ key: string }> {
  const response = await fetch(`/api/admin/api-keys/${id}/rotate-force`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error("Failed to rotate key")
  }
  return response.json()
}

export default function AdminApiKeysPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [searchType, setSearchType] = useState<"email" | "prefix">("email")
  const [page, setPage] = useState(1)
  const [selectedKey, setSelectedKey] = useState<AdminApiKey | null>(null)
  const [showRotatedKey, setShowRotatedKey] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["adminApiKeys", statusFilter, search, searchType, page],
    queryFn: () => fetchAdminApiKeys({ status: statusFilter, search, searchType, page, limit: 20 }),
    staleTime: 30 * 1000,
  })

  const revokeMutation = useMutation({
    mutationFn: forceRevokeKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminApiKeys"] })
      toast.success("API key revoked")
    },
    onError: (error: Error) => {
      toast.error("Failed to revoke key", { description: error.message })
    },
  })

  const rotateMutation = useMutation({
    mutationFn: forceRotateKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminApiKeys"] })
      setShowRotatedKey(data.key)
      toast.success("API key rotated")
    },
    onError: (error: Error) => {
      toast.error("Failed to rotate key", { description: error.message })
    },
  })

  const handleRevoke = (key: AdminApiKey) => {
    if (confirm(`Force revoke "${key.name}"? This action cannot be undone.`)) {
      revokeMutation.mutate(key.id)
    }
  }

  const handleRotate = (key: AdminApiKey) => {
    if (confirm(`Force rotate "${key.name}"? The old key will be revoked.`)) {
      rotateMutation.mutate(key.id)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin: API Keys</h1>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage all API keys across all users</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search Type</Label>
              <Select value={searchType} onValueChange={(v) => setSearchType(v as "email" | "prefix")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="prefix">Prefix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={searchType === "email" ? "Search by email..." : "Search by prefix..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>All API Keys</CardTitle>
          <CardDescription>
            {data?.pagination?.total || 0} total keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !data?.keys || data.keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No API keys found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate Limits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{key.userEmail || "Unknown"}</div>
                          {key.userName && (
                            <div className="text-muted-foreground text-xs">{key.userName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono cursor-help">
                                {key.prefix}...
                              </code>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Prefix: {key.prefix}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.slice(0, 2).map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                          {key.scopes.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{key.scopes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {key.usageCount.toLocaleString()}
                      </TableCell>
                      <TableCell>{format(new Date(key.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            key.status === "active"
                              ? "default"
                              : key.status === "revoked"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.rateLimitPerMinute}/min, {key.rateLimitPerDay}/day
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedKey(key)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {key.status === "active" && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRotate(key)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Force Rotate</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRevoke(key)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Force Revoke</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rotated Key Dialog */}
      {showRotatedKey && (
        <Dialog open={!!showRotatedKey} onOpenChange={() => setShowRotatedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Rotated (Admin)</DialogTitle>
              <DialogDescription>
                Save this new key now. The old key has been revoked.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={showRotatedKey} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(showRotatedKey)
                    toast.success("Copied to clipboard")
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This is the only time you&apos;ll see this key. Make sure to save it securely.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowRotatedKey(null)}>I&apos;ve saved it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

