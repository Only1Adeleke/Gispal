"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Lazy load heavy chart components
const UsageCharts = dynamic(() => import("./UsageCharts").then((mod) => ({ default: mod.UsageCharts })), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  ),
})

interface ApiKeyUsageStatsProps {
  apiKeyId: string
}

interface UsageData {
  range: string
  today: number
  thisMonth: number
  total: number
  success: number
  errors: number
  avgLatency: number
  callsPerHour: Array<{ hour: number; count: number }>
  topRoutes: Array<{ route: string; count: number }>
}

async function fetchUsage(apiKeyId: string, range: string): Promise<UsageData> {
  const response = await fetch(`/api/keys/${apiKeyId}/usage?range=${range}`)
  if (!response.ok) throw new Error("Failed to fetch usage")
  return response.json()
}

export function ApiKeyUsageStats({ apiKeyId }: ApiKeyUsageStatsProps) {
  const [range, setRange] = useState<string>("today")

  const { data: usage, isLoading } = useQuery({
    queryKey: ["apiKeyUsage", apiKeyId, range],
    queryFn: () => fetchUsage(apiKeyId, range),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>No usage data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Prepare chart data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = usage.callsPerHour.find((h: any) => h.hour === i)
    return {
      hour: `${i.toString().padStart(2, "0")}:00`,
      calls: hourData?.count || 0,
    }
  })

  const successErrorData = [
    { name: "Success", value: usage.success, fill: "#10b981" },
    { name: "Errors", value: usage.errors, fill: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      {/* Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">API calls today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.thisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">API calls this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.total > 0 ? Math.round((usage.success / usage.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usage.success.toLocaleString()} successful, {usage.errors.toLocaleString()} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Lazy loaded */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Charts</CardTitle>
          <CardDescription>Visual analytics for API usage</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageCharts hourlyData={hourlyData} successErrorData={successErrorData} />
        </CardContent>
      </Card>

      {/* Top Routes */}
      {usage.topRoutes && usage.topRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Used Routes</CardTitle>
            <CardDescription>Top 10 API endpoints by usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usage.topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <code className="text-sm font-mono">{route.route}</code>
                  <span className="text-sm font-semibold">{route.count.toLocaleString()} calls</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
