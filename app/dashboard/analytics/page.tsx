/**
 * Usage & Analytics Page
 * Premium financial control panel for user consumption tracking
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/dashboard/page-header"
import { AnalyticsContentWrapper } from "@/components/dashboard/analytics/analytics-content-wrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const range = (params?.range as "7d" | "30d" | "90d") || "30d"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Analytics"
        description="Monitor consumption patterns, cost drivers, and plan limits to optimize your usage and billing."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Usage & Analytics" },
        ]}
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Time Range Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
            {/* KPI Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="relative overflow-hidden rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-zinc-900/30 to-violet-950/10 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-9 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Chart Skeleton */}
            <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </CardContent>
            </Card>
            {/* Breakdown Skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Limits Card Skeleton */}
            <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <AnalyticsContentWrapper range={range} />
      </Suspense>
    </div>
  )
}

