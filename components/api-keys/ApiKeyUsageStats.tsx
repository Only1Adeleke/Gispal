"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApiKeys, type ApiKeyUsage } from "@/hooks/useApiKeys"
import { Skeleton } from "@/components/ui/skeleton"

interface ApiKeyUsageStatsProps {
  apiKeyId: string
}

export function ApiKeyUsageStats({ apiKeyId }: ApiKeyUsageStatsProps) {
  const { getUsage } = useApiKeys()
  const [usage, setUsage] = useState<ApiKeyUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsage = async () => {
      setLoading(true)
      const stats = await getUsage(apiKeyId)
      setUsage(stats)
      setLoading(false)
    }
    loadUsage()
  }, [apiKeyId, getUsage])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.today}</div>
          <p className="text-xs text-muted-foreground">API calls today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.thisMonth}</div>
          <p className="text-xs text-muted-foreground">API calls this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {usage.total > 0
              ? Math.round((usage.success / usage.total) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-muted-foreground">
            {usage.success} successful, {usage.errors} errors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.total}</div>
          <p className="text-xs text-muted-foreground">All-time API calls</p>
        </CardContent>
      </Card>

      {usage.topRoutes && usage.topRoutes.length > 0 && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Most Used Routes</CardTitle>
            <CardDescription>Top 10 API endpoints by usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usage.topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between">
                  <code className="text-sm font-mono">{route.route}</code>
                  <span className="text-sm text-muted-foreground">{route.count} calls</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

