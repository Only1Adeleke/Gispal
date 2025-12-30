"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"
import { RotateCcw, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { useApiKeys } from "@/hooks/useApiKeys"
import type { ServerApiKey } from "@/lib/server/api-keys"

interface ApiKeysTableProps {
  keys: ServerApiKey[]
}

export function ApiKeysTable({ keys: initialKeys }: ApiKeysTableProps) {
  const router = useRouter()
  const { revokeKey, rotateKey } = useApiKeys()
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const handleRotate = async (key: ServerApiKey) => {
    try {
      const result = await rotateKey(key.id)
      if (result) {
        toast.success("API key rotated", {
          description: "Save the new key now - you won't see it again!",
          action: {
            label: "View",
            onClick: () => {
              // Show key in a dialog or copy to clipboard
              navigator.clipboard.writeText(result.key)
              toast.success("Copied to clipboard")
            },
          },
        })
        router.refresh()
      }
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRevoke = async (key: ServerApiKey) => {
    if (!confirm(`Are you sure you want to revoke "${key.name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await revokeKey(key.id)
      router.refresh()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  if (keys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Manage and monitor your API keys</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Key className="h-12 w-12 text-muted-foreground" />}
            title="No API keys yet"
            description="Create your first API key to start integrating Gispal into your applications."
            action={
              <Button onClick={() => router.push("/dashboard/api-keys")}>
                Create API Key
              </Button>
            }
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your API Keys</CardTitle>
        <CardDescription>Manage and monitor your API keys</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800/50 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Prefix
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Scopes
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Usage
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Created
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Last Used
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Rate Limits
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {keys.map((key, index) => {
              const isLast = index === keys.length - 1
              return (
                <TableRow
                  key={key.id}
                  className={cn(
                    "border-zinc-800/50 transition-all duration-200",
                    "hover:bg-zinc-900/50 hover:border-zinc-700/50",
                    "group cursor-pointer",
                    !isLast && "border-b"
                  )}
                >
                  <TableCell className="font-medium">
                    <span className="text-sm text-foreground group-hover:text-violet-100 transition-colors">
                      {key.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-xs bg-zinc-900/50 border border-zinc-800/50 px-2 py-1 rounded font-mono cursor-help hover:bg-zinc-800/50 hover:border-violet-500/30 transition-colors">
                            {key.prefix || "gispal_"}...
                          </code>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">Key prefix: {key.prefix || "gispal_"}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Use this prefix to identify your key in logs and analytics
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(key.scopes || []).slice(0, 2).map((scope) => (
                        <Badge
                          key={scope}
                          variant="secondary"
                          className="text-xs border-zinc-700/50 bg-zinc-900/30 text-zinc-400 group-hover:border-violet-500/30 group-hover:text-violet-300 transition-colors"
                        >
                          {scope}
                        </Badge>
                      ))}
                      {(key.scopes || []).length > 2 && (
                        <Badge
                          variant="secondary"
                          className="text-xs border-zinc-700/50 bg-zinc-900/30 text-zinc-400"
                        >
                          +{(key.scopes || []).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    {key.usageCount?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    {format(new Date(key.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, yyyy") : (
                      <span className="text-zinc-600">Never</span>
                    )}
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
                      className="text-xs"
                    >
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors cursor-help">
                            {key.rateLimitPerMinute}/min, {key.rateLimitPerDay}/day
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm font-medium">Rate Limits</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {key.rateLimitPerMinute} requests per minute
                          </p>
                          <p className="text-xs text-zinc-400">
                            {key.rateLimitPerDay.toLocaleString()} requests per day
                          </p>
                          <p className="text-xs text-zinc-500 mt-2">
                            Exceeding limits may result in rate limiting or additional charges
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {key.status === "active" && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRotate(key)
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-violet-500/10 hover:text-violet-400 transition-all"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Rotate key</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRevoke(key)
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Revoke key</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  )
}

