/**
 * API Keys Dashboard Page
 * Server Component - fetches data directly from database
 */

import { Suspense } from "react"
import { getUserApiKeys } from "@/lib/server/api-keys"
import { CreateApiKeyDialog } from "@/components/api-keys/CreateApiKeyDialog"
import { ApiKeysTable } from "@/components/api-keys/ApiKeysTable"
import { SkeletonTable } from "@/components/ui/skeleton-table"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function ApiKeysContent() {
  const keys = await getUserApiKeys()
  return <ApiKeysTable keys={keys} />
}

export default async function ApiKeysPage() {
  // Check authentication
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage your API keys for programmatic access"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "API Keys" },
        ]}
        actions={<CreateApiKeyDialog />}
      />

      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <SkeletonTable rows={5} cols={9} />
            </CardContent>
          </Card>
        }
      >
        <ApiKeysContent />
      </Suspense>
    </div>
  )
}
