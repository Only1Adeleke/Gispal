import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: {} })
  
  if (!session) {
    redirect("/login")
  }

  const user = await db.users.findById(session.user.id)
  if (!user) {
    redirect("/login")
  }

  const jingles = await db.jingles.findByUserId(session.user.id)
  const coverArts = await db.coverArts.findByUserId(session.user.id)

  const formatBytes = (bytes: number) => {
    if (bytes === Infinity) return "Unlimited"
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const bandwidthUsed = formatBytes(user.bandwidthUsed)
  const bandwidthLimit = formatBytes(user.bandwidthLimit)
  const bandwidthPercent = user.bandwidthLimit === Infinity 
    ? 0 
    : (user.bandwidthUsed / user.bandwidthLimit) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.name || user.email}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user.plan.replace(/_/g, " ")}
            </div>
            {user.planExpiresAt && (
              <p className="text-sm text-gray-600 mt-2">
                Expires: {new Date(user.planExpiresAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bandwidth Usage</CardTitle>
            <CardDescription>This month's usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bandwidthUsed} / {bandwidthLimit}
            </div>
            {user.bandwidthLimit !== Infinity && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(bandwidthPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jingles</CardTitle>
            <CardDescription>Total jingles uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jingles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Arts</CardTitle>
            <CardDescription>Total cover arts uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverArts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My API Key</CardTitle>
          <CardDescription>Use this key to access the WordPress plugin API</CardDescription>
        </CardHeader>
        <CardContent>
          {user.apiKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md font-mono text-sm">
                {user.apiKey.substring(0, 20)}...
              </div>
              <p className="text-sm text-gray-600">
                Created: {user.apiKeyCreatedAt ? new Date(user.apiKeyCreatedAt).toLocaleString() : "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                Go to Settings to regenerate your API key
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">No API key generated yet.</p>
              <a
                href="/dashboard/settings"
                className="text-primary hover:underline"
              >
                Generate API key in Settings →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

