"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiKeys, type ApiKey } from "@/hooks/useApiKeys"
import { format } from "date-fns"
import { Plus, Copy, RotateCcw, Trash2, Key, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { ALL_SCOPES, API_SCOPES } from "@/lib/api-keys/utils"
import { CreateApiKeyDialog } from "@/components/api-keys/CreateApiKeyDialog"
import { ApiKeyUsageStats } from "@/components/api-keys/ApiKeyUsageStats"

export default function ApiKeysPage() {
  const { keys, loading, revokeKey, rotateKey, getUsage } = useApiKeys()
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [showRotatedKey, setShowRotatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const handleViewUsage = async (key: ApiKey) => {
    const stats = await getUsage(key.id)
    if (stats) {
      setUsageStats(stats)
      setSelectedKey(key)
    }
  }

  const handleRotate = async (key: ApiKey) => {
    const result = await rotateKey(key.id)
    if (result) {
      setShowRotatedKey(result.key)
    }
  }

  const handleRevoke = async (key: ApiKey) => {
    if (!confirm(`Are you sure you want to revoke "${key.name}"? This action cannot be undone.`)) {
      return
    }
    await revokeKey(key.id)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
        </div>
        <CreateApiKeyDialog onKeyCreated={(key) => setShowNewKey(key)} />
      </div>

      {/* Show new key dialog */}
      {showNewKey && (
        <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Save this key now. You will not be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={showNewKey} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(showNewKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This is the only time you&apos;ll see this key. Make sure to save it securely.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowNewKey(null)}>I&apos;ve saved it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Show rotated key dialog */}
      {showRotatedKey && (
        <Dialog open={!!showRotatedKey} onOpenChange={() => setShowRotatedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Rotated</DialogTitle>
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
                  onClick={() => copyToClipboard(showRotatedKey)}
                >
                  <Copy className="h-4 w-4" />
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

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          {selectedKey && <TabsTrigger value="usage">Usage Analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>Manage and monitor your API keys</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : keys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rate Limits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(key.scopes || []).slice(0, 2).map((scope) => (
                              <Badge key={scope} variant="secondary" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                            {(key.scopes || []).length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(key.scopes || []).length - 2}
                              </Badge>
                            )}
                          </div>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUsage(key)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {key.status === "active" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRotate(key)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(key)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedKey && (
          <TabsContent value="usage" className="space-y-4">
            <ApiKeyUsageStats apiKeyId={selectedKey.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

