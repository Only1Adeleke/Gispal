"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalyticsRangeSelectorProps {
  defaultRange: "7d" | "30d" | "90d"
}

export function AnalyticsRangeSelector({ defaultRange }: AnalyticsRangeSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRange = (searchParams.get("range") as "7d" | "30d" | "90d") || defaultRange

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("range", value)
    router.push(`/dashboard/analytics?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Time Range
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Select the period for analytics analysis
        </p>
      </div>
      <Tabs value={currentRange} onValueChange={handleRangeChange}>
        <TabsList className="grid w-auto grid-cols-3">
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

