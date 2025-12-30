"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load chart components
const UsageCharts = dynamic(() => import("./usage-charts-internal").then((mod) => ({ default: mod.UsageChartsInternal })), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />,
})

interface UsageChartProps {
  data: {
    "7d": Array<{ date: string; value: number }>
    "30d": Array<{ date: string; value: number }>
    "90d": Array<{ date: string; value: number }>
  }
}

export function UsageChart({ data }: UsageChartProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>API usage trends over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={range} onValueChange={(v) => setRange(v as "7d" | "30d" | "90d")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
          </TabsList>
          <TabsContent value={range} className="mt-4">
            <UsageCharts data={data[range]} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
