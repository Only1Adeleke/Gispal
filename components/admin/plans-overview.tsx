"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminPlansOverviewProps {
  users: any[]
  planLimits: any
}

export function AdminPlansOverview({ users, planLimits: initialPlanLimits }: AdminPlansOverviewProps) {
  const router = useRouter()
  const [planLimits, setPlanLimits] = React.useState(initialPlanLimits || {
    free: {
      jingles: 1,
      coverArts: 1,
      jinglePositions: ["start"],
      volumeControl: false,
      fullExport: false,
      previewDuration: 30,
      bandwidthLimit: 100 * 1024 * 1024,
    },
    pro: {
      jingles: Infinity,
      coverArts: Infinity,
      jinglePositions: ["start", "middle", "end"],
      volumeControl: true,
      fullExport: true,
      previewDuration: null,
      bandwidthLimit: Infinity,
    },
  })
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<"free" | "pro">("free")
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    jingles: 1,
    coverArts: 1,
    previewDuration: 30,
  })

  const freeUsers = users.filter((u) => u.plan === "free")
  const proUsers = users.filter((u) => u.plan !== "free")

  const handleEditPlan = (plan: "free" | "pro") => {
    setSelectedPlan(plan)
    const limits = planLimits[plan]
    setFormData({
      jingles: limits.jingles === Infinity ? 0 : limits.jingles,
      coverArts: limits.coverArts === Infinity ? 0 : limits.coverArts,
      previewDuration: limits.previewDuration || 0,
    })
    setEditDialogOpen(true)
  }

  const handleSavePlan = async () => {
    setLoading(true)
    try {
      const updates = {
        jingles: formData.jingles === 0 ? Infinity : formData.jingles,
        coverArts: formData.coverArts === 0 ? Infinity : formData.coverArts,
        previewDuration: formData.previewDuration === 0 ? null : formData.previewDuration,
      }

      const response = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          limits: updates,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update plan")
      }

      const updated = await response.json()
      setPlanLimits(updated)
      toast.success(`${selectedPlan === "free" ? "Free" : "Pro"} plan updated`)
      setEditDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update plan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Free Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Free Plan</CardTitle>
                <CardDescription>Basic features for free users</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditPlan("free")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Limits:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Jingles: {planLimits.free.jingles === Infinity ? "Unlimited" : planLimits.free.jingles}</li>
                <li>• Cover Arts: {planLimits.free.coverArts === Infinity ? "Unlimited" : planLimits.free.coverArts}</li>
                <li>• Positions: {planLimits.free.jinglePositions.join(", ")}</li>
                <li>• Volume Control: {planLimits.free.volumeControl ? "Yes" : "No"}</li>
                <li>• Full Export: {planLimits.free.fullExport ? "Yes" : "No"}</li>
                <li>• Preview Duration: {planLimits.free.previewDuration || "None"}{planLimits.free.previewDuration ? "s" : ""}</li>
                <li>• Bandwidth: {planLimits.free.bandwidthLimit === Infinity ? "Unlimited" : `${Math.round(planLimits.free.bandwidthLimit / 1024 / 1024)}MB`}</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium">
                Users on this plan: <Badge>{freeUsers.length}</Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pro Plan</CardTitle>
                <CardDescription>Unlimited features for pro users</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditPlan("pro")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Limits:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Jingles: Unlimited</li>
                <li>• Cover Arts: Unlimited</li>
                <li>• Positions: All (start, middle, end)</li>
                <li>• Volume Control: Yes</li>
                <li>• Full Export: Yes</li>
                <li>• Preview Duration: None</li>
                <li>• Bandwidth: Unlimited</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium">
                Users on this plan: <Badge>{proUsers.length}</Badge>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Plan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users by Plan</CardTitle>
          <CardDescription>Distribution of users across plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>User Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">Free</Badge>
                </TableCell>
                <TableCell>{freeUsers.length}</TableCell>
                <TableCell>
                  {users.length > 0
                    ? ((freeUsers.length / users.length) * 100).toFixed(1)
                    : 0}
                  %
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge>Pro</Badge>
                </TableCell>
                <TableCell>{proUsers.length}</TableCell>
                <TableCell>
                  {users.length > 0
                    ? ((proUsers.length / users.length) * 100).toFixed(1)
                    : 0}
                  %
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedPlan === "free" ? "Free" : "Pro"} Plan</DialogTitle>
            <DialogDescription>
              Modify plan limits and features. Changes will affect all users on this plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Max Jingles</Label>
              <Input
                type="number"
                value={formData.jingles}
                onChange={(e) =>
                  setFormData({ ...formData, jingles: parseInt(e.target.value) || 0 })
                }
                placeholder="0 for unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Cover Arts</Label>
              <Input
                type="number"
                value={formData.coverArts}
                onChange={(e) =>
                  setFormData({ ...formData, coverArts: parseInt(e.target.value) || 0 })
                }
                placeholder="0 for unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Preview Duration (seconds)</Label>
              <Input
                type="number"
                value={formData.previewDuration}
                onChange={(e) =>
                  setFormData({ ...formData, previewDuration: parseInt(e.target.value) || 0 })
                }
                placeholder="0 for no limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
