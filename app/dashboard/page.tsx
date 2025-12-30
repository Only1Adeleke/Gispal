/**
 * Premium Dashboard Home Page
 * Financial-grade UI with hero metrics, charts, activity, and quick actions
 */

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getDashboardMetrics, getUsageChartData, getRecentActivity } from "@/lib/server/dashboard"
import { Activity, Key, Zap, HardDrive, TrendingUp, Sliders, Music, Plus, BarChart3, Info } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function HeroMetricCard({
  title,
  value,
  label,
  icon: Icon,
  trend,
  tooltip,
}: {
  title: string
  value: string | number
  label: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  tooltip?: string
}) {
  return (
    <TooltipProvider>
      <Card className="group relative overflow-hidden rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-zinc-900/30 to-violet-950/10 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {title}
            </CardTitle>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-violet-400 transition-colors">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="rounded-lg bg-violet-500/10 p-2 border border-violet-500/20 group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-all duration-300">
            <Icon className="h-4 w-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold tracking-tight text-foreground group-hover:text-violet-100 transition-colors">
            {value.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-zinc-500">{label}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <TrendingUp className="h-3 w-3" />
                <span className={trend.value > 0 ? "text-emerald-400" : "text-red-400"}>
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-zinc-600">{trend.label}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

async function DashboardContent() {
  const [metrics, usageData, activities] = await Promise.all([
    getDashboardMetrics(),
    getUsageChartData(),
    getRecentActivity(),
  ])

  const isEmpty = metrics.totalApiKeys === 0 && metrics.totalUsage === 0

  return (
    <>
      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HeroMetricCard
          title="API Requests"
          value={metrics.totalUsage}
          label="This month"
          icon={Activity}
          trend={{ value: 12, label: "vs last month" }}
          tooltip="Total API requests made across all your keys this month. Exceeding your plan's daily limit may result in rate limiting or additional charges."
        />
        <HeroMetricCard
          title="Audio Minutes"
          value={0}
          label="Processed"
          icon={Zap}
          tooltip="Total audio processing time in minutes. Each mix, conversion, or processing job consumes minutes from your plan allocation."
        />
        <HeroMetricCard
          title="Storage Used"
          value="0 MB"
          label="Of unlimited"
          icon={HardDrive}
          tooltip="Total storage used for your audio files, jingles, and cover art. Pro plans include unlimited storage."
        />
        <HeroMetricCard
          title="Current Plan"
          value={metrics.currentPlan}
          label="Active subscription"
          icon={Key}
          tooltip={`Your active subscription plan (${metrics.currentPlan}). Upgrade to increase rate limits, storage, and access premium features.`}
        />
      </div>

      {/* Central Usage Chart */}
      <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage & Analytics</CardTitle>
              <CardDescription className="text-zinc-500">
                Monitor API consumption patterns and billing impact over time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsageChart data={usageData} />
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="text-zinc-500">
              Audit trail of API calls, key operations, and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <RecentActivity activities={activities} />
            ) : (
              <EmptyState
                icon={<Activity className="h-12 w-12 text-zinc-600" />}
                title="No activity recorded"
                description="Once you create an API key and make your first request, activity logs will appear here. This helps you monitor usage and troubleshoot issues."
                action={
                  <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Link href="/dashboard/api-keys">Create Your First API Key</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription className="text-zinc-500">
              Frequently used workflows and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              asChild
              className="group w-full justify-start h-auto py-3 px-4 rounded-xl border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-200"
              variant="outline"
            >
              <Link href="/dashboard/mix">
                <Sliders className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <div className="text-left">
                  <div className="font-medium text-sm">Mix Audio</div>
                  <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Overlay jingles on tracks
                  </div>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              className="group w-full justify-start h-auto py-3 px-4 rounded-xl border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-200"
              variant="outline"
            >
              <Link href="/dashboard/jingles">
                <Music className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <div className="text-left">
                  <div className="font-medium text-sm">Manage Jingles</div>
                  <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Upload and organize audio
                  </div>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              className="group w-full justify-start h-auto py-3 px-4 rounded-xl border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-200"
              variant="outline"
            >
              <Link href="/dashboard/api-keys">
                <Plus className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <div className="text-left">
                  <div className="font-medium text-sm">Create API Key</div>
                  <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Generate secure access token
                  </div>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              className="group w-full justify-start h-auto py-3 px-4 rounded-xl border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-200"
              variant="outline"
            >
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <div className="text-left">
                  <div className="font-medium text-sm">View Usage</div>
                  <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Detailed analytics dashboard
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Empty State for new users */}
      {isEmpty && (
        <Card className="rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-violet-950/5 to-zinc-950/50 backdrop-blur-sm">
          <CardContent className="pt-12 pb-12">
            <EmptyState
              icon={<Key className="h-16 w-16 text-violet-500/50" />}
              title="Welcome to Gispal"
              description="Get started by creating your first API key. This enables programmatic access to our audio processing API, allowing you to mix audio, manage jingles, and process files at scale. Each key includes usage tracking and rate limits based on your subscription plan."
              action={
                <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all">
                  <Link href="/dashboard/api-keys">Create Your First API Key</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default async function DashboardPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Hero Metrics Skeleton - Exact match */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="relative overflow-hidden rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-zinc-900/30 to-violet-950/10 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-20 mb-2" />
                    <div className="flex items-center justify-between mt-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Chart Skeleton - Exact match */}
            <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </CardContent>
            </Card>
            {/* Activity & Actions Skeleton - Exact match */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800/50">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
