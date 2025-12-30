"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Zap, Download } from "lucide-react"

// Lazy load chart components
const UsageCharts = dynamic(
  () => import("../usage-charts-internal").then((mod) => ({ default: mod.UsageChartsInternal })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
  }
)

interface AnalyticsChartProps {
  data: {
    "7d": Array<{ date: string; value: number }>
    "30d": Array<{ date: string; value: number }>
    "90d": Array<{ date: string; value: number }>
  }
  range: "7d" | "30d" | "90d"
}

export function AnalyticsChart({ data, range }: AnalyticsChartProps) {
  const [metric, setMetric] = useState<"requests" | "audio" | "downloads">("requests")

  const chartData = data[range] || []

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription className="text-zinc-500">
              Track consumption patterns over time to identify cost drivers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as "requests" | "audio" | "downloads")}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              API Requests
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Audio Minutes
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5" />
              Downloads
            </TabsTrigger>
          </TabsList>
          <TabsContent value={metric} className="mt-0">
            <UsageCharts data={chartData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

