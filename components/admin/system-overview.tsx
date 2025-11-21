"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

interface AdminSystemOverviewProps {
  jingles: any[]
  coverArts: any[]
}

export function AdminSystemOverview({ jingles, coverArts }: AdminSystemOverviewProps) {
  const allJingles = jingles
  const allCoverArts = coverArts

  // Calculate storage distribution
  const jinglesSize = allJingles.reduce((sum: number, j: any) => sum + (j.fileSize || 0), 0)
  const coverArtsSize = allCoverArts.reduce((sum: number, c: any) => sum + (c.fileSize || 0), 0)
  const totalSize = jinglesSize + coverArtsSize

  const storageData = [
    { name: "Jingles", value: jinglesSize },
    { name: "Cover Arts", value: coverArtsSize },
  ]

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  // Mock server health
  const serverHealth = {
    status: "healthy",
    uptime: "99.9%",
    responseTime: "120ms",
  }

  // Mock queued jobs
  const queuedJobs = 0

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Server Health */}
      <Card>
        <CardHeader>
          <CardTitle>Server Health</CardTitle>
          <CardDescription>Current server status and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={serverHealth.status === "healthy" ? "default" : "destructive"}>
              {serverHealth.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uptime</span>
            <span className="text-sm text-muted-foreground">{serverHealth.uptime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Avg Response Time</span>
            <span className="text-sm text-muted-foreground">{serverHealth.responseTime}</span>
          </div>
        </CardContent>
      </Card>

      {/* Queued Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Queued Jobs</CardTitle>
          <CardDescription>Background processing queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queuedJobs}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Jobs waiting to be processed
          </p>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Storage Distribution</CardTitle>
          <CardDescription>Breakdown of storage usage by file type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBytes(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Total Storage Used</span>
              <span className="font-medium">{formatBytes(totalSize)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Jingles</span>
              <span className="text-muted-foreground">{formatBytes(jinglesSize)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Cover Arts</span>
              <span className="text-muted-foreground">{formatBytes(coverArtsSize)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temporary File Cleanup */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Temporary File Cleanup</CardTitle>
          <CardDescription>Automatic cleanup schedule and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cleanup Interval</span>
            <Badge>Every 10 minutes</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Files Deleted (Last 24h)</span>
            <span className="text-sm text-muted-foreground">0</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Storage Freed (Last 24h)</span>
              <span className="text-muted-foreground">0 Bytes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
          <CardDescription>Latest system events and errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No logs available
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

