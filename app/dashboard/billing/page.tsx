/**
 * Billing Dashboard Page
 * Server Component - fetches data directly from database
 */

import { Suspense } from "react"
import { getPaymentPlans, getUserSubscription } from "@/lib/server/subscriptions"
import { BillingContent } from "@/components/billing/BillingContent"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function BillingData() {
  const [plans, subscription] = await Promise.all([
    getPaymentPlans(),
    getUserSubscription(),
  ])

  return <BillingContent plans={plans} subscription={subscription} />
}

export default async function BillingPage() {
  // Check authentication
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription and rate limits"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Billing" },
        ]}
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <BillingData />
      </Suspense>
    </div>
  )
}
