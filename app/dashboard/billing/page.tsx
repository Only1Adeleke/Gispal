"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Copy, Key, TrendingUp, Upload, Download, Sliders } from "lucide-react"
import { format } from "date-fns"

interface ApiKey {
  id: string
  key: string
  createdAt: number
  lastUsedAt?: number
  usageCount: number
  active: boolean
}

interface Usage {
  totalMixes: number
  totalUploads: number
  totalDownloads: number
  wordpressApiRequests: number
  history: Array<{
    type: string
    timestamp: number
    meta?: any
  }>
}

interface UserPlan {
  plan: string
}

export default function BillingPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingKey, setCreatingKey] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [keysRes, usageRes, planRes] = await Promise.all([
        fetch("/api/api-keys"),
        fetch("/api/usage"),
        fetch("/api/user/plan"),
      ])

      if (keysRes.ok) {
        const keys = await keysRes.json()
        setApiKeys(keys)
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }

      if (planRes.ok) {
        const plan = await planRes.json()
        setUserPlan(plan)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load billing data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    setCreatingKey(true)
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create API key")
      }

      const newKey = await response.json()
      setApiKeys([...apiKeys, newKey])
      toast.success("API key created successfully!")
    } catch (error: any) {
      console.error("Error creating API key:", error)
      toast.error(error.message || "Failed to create API key")
    } finally {
      setCreatingKey(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      setApiKeys(apiKeys.filter(k => k.id !== id))
      toast.success("API key deleted successfully")
    } catch (error: any) {
      console.error("Error deleting API key:", error)
      toast.error(error.message || "Failed to delete API key")
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success("API key copied to clipboard")
  }

  const getTodayCount = (type: string): number => {
    if (!usage) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()
    return usage.history.filter(h => h.type === type && h.timestamp >= todayTimestamp).length
  }

  const isPro = userPlan?.plan && userPlan.plan !== "free"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your subscription, API keys, and track usage
        </p>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mixes Today</CardTitle>
                <Sliders className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTodayCount("mix")}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {usage?.totalMixes || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uploads Today</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTodayCount("upload")}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {usage?.totalUploads || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads Today</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTodayCount("download")}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {usage?.totalDownloads || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WP API Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.wordpressApiRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {isPro ? "Unlimited" : "PRO only"}
                </p>
              </CardContent>
            </Card>
          </div>

          {!isPro && (
            <Card>
              <CardHeader>
                <CardTitle>Free Tier Limits</CardTitle>
                <CardDescription>
                  You&apos;re on the free plan. Upgrade to PRO for unlimited access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Maximum 5 mixes per day</li>
                  <li>Maximum 5 uploads per day</li>
                  <li>Maximum 5 minutes per audio file</li>
                  <li>Maximum 120 seconds per jingle</li>
                  <li>No WordPress API access</li>
                </ul>
                <Button
                  className="mt-4"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  Upgrade to PRO
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for WordPress plugin integration
                  </CardDescription>
                </div>
                <Button
                  onClick={handleCreateKey}
                  disabled={creatingKey || !isPro}
                  title={!isPro ? "PRO plan required" : ""}
                >
                  {creatingKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Key
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!isPro ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>API keys are only available for PRO users.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowUpgradeDialog(true)}
                  >
                    Upgrade to PRO
                  </Button>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys yet. Create one to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Usage Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm">
                          {key.key.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          {format(new Date(key.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {key.lastUsedAt
                            ? format(new Date(key.lastUsedAt), "MMM dd, yyyy HH:mm")
                            : "Never"}
                        </TableCell>
                        <TableCell>{key.usageCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyKey(key.key)}
                              title="Copy key"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id)}
                              title="Delete key"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade to PRO</CardTitle>
              <CardDescription>
                Unlock unlimited features and WordPress API access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">PRO Features:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Unlimited mixes per day</li>
                    <li>Unlimited uploads per day</li>
                    <li>No file length restrictions</li>
                    <li>WordPress plugin API access</li>
                    <li>Priority support</li>
                  </ul>
                </div>
                <Button onClick={() => setShowUpgradeDialog(true)}>
                  Upgrade to PRO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to PRO</DialogTitle>
            <DialogDescription>
              PRO features are coming soon. This is a placeholder for the upgrade flow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The upgrade system will be implemented in a future update. For now, you can test PRO features by updating your plan in the database.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
