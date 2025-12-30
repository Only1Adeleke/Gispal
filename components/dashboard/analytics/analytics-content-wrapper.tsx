import { getAnalyticsKPIs, getUsageByFeature, getUsageByKey, getPlanLimits } from "@/lib/server/analytics"
import { getUsageChartData } from "@/lib/server/dashboard"
import { AnalyticsKPICard } from "./analytics-kpi-card"
import { AnalyticsChart } from "./analytics-chart"
import { UsageBreakdown } from "./usage-breakdown"
import { PlanLimitsCard } from "./plan-limits-card"
import { InsightsSection, InsightsSectionSkeleton } from "./insights-section"
import { AnalyticsRangeSelector } from "./analytics-range-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity, HardDrive, Download, Zap } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

interface AnalyticsContentWrapperProps {
  range?: "7d" | "30d" | "90d"
}

export async function AnalyticsContentWrapper({ range = "30d" }: AnalyticsContentWrapperProps) {
  const [kpis, usageByFeature, usageByKey, planLimits, chartData] = await Promise.all([
    getAnalyticsKPIs(range),
    getUsageByFeature(range),
    getUsageByKey(range),
    getPlanLimits(),
    getUsageChartData(),
  ])

  const isEmpty = kpis.apiRequests.current === 0 && kpis.audioMinutes.current === 0

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <AnalyticsRangeSelector defaultRange={range} />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsKPICard
          title="API Requests"
          value={kpis.apiRequests.current}
          previous={kpis.apiRequests.previous}
          trend={kpis.apiRequests.trend}
          icon="Activity"
          tooltip="Total API requests made across all your keys. Each request consumes from your plan's rate limits and may incur charges on usage-based plans."
        />
        <AnalyticsKPICard
          title="Audio Minutes"
          value={kpis.audioMinutes.current}
          previous={kpis.audioMinutes.previous}
          trend={kpis.audioMinutes.trend}
          icon="Zap"
          tooltip="Total audio processing time in minutes. Mixing, conversion, and processing jobs consume minutes from your plan allocation."
        />
        <AnalyticsKPICard
          title="Downloads"
          value={kpis.downloads.current}
          previous={kpis.downloads.previous}
          trend={kpis.downloads.trend}
          icon="Download"
          tooltip="Total files downloaded from external sources (YouTube, Audiomack, etc.). Each download counts toward your bandwidth usage."
        />
        <AnalyticsKPICard
          title="Storage Used"
          value={`${kpis.storageUsed.current} MB`}
          previous={0}
          trend={0}
          icon="HardDrive"
          tooltip={`Storage used for audio files, jingles, and cover art. ${typeof kpis.storageUsed.limit === "number" ? `Limit: ${kpis.storageUsed.limit} MB` : "Unlimited storage on your plan."}`}
        />
      </div>

      {/* Primary Usage Chart */}
      <AnalyticsChart data={chartData} range={range} />

      {/* Insights & Cost Drivers */}
      <Suspense fallback={<InsightsSectionSkeleton />}>
        <InsightsSection range={range} />
      </Suspense>

      {/* Breakdown Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UsageBreakdown
          title="Usage by Feature"
          data={usageByFeature}
          emptyMessage="No feature usage data available. Start making API calls to see breakdowns."
        />
        <UsageBreakdown
          title="Usage by API Key"
          data={usageByKey.map((k) => ({
            feature: k.keyName,
            requests: k.requests,
            percentage: k.percentage,
            metadata: { prefix: k.keyPrefix, status: k.status },
          }))}
          emptyMessage="No API key usage data. Create an API key and start making requests."
        />
      </div>

      {/* Limits & Warnings Card */}
      <PlanLimitsCard limits={planLimits} />

      {/* Empty State */}
      {isEmpty && (
        <Card className="rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-violet-950/5 to-zinc-950/50 backdrop-blur-sm">
          <CardContent className="pt-12 pb-12">
            <EmptyState
              icon={<Activity className="h-16 w-16 text-violet-500/50" />}
              title="No usage data yet"
              description="Analytics will appear here once you create an API key and start making requests. Track consumption, identify cost drivers, and monitor your plan limits."
              action={
                <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all">
                  <Link href="/dashboard/api-keys">Create Your First API Key</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

