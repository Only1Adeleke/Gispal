import { redirect } from "next/navigation"
import { headers } from "next/headers"
import dynamic from "next/dynamic"
import { auth } from "@/lib/auth"
import { db, User } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isProPlan, getMaxJingles, getMaxCoverArts } from "@/lib/plan-restrictions"
import { Music, Image, Clock, Zap } from "lucide-react"

// Dynamic import for client component
const UpgradeDialog = dynamic(() => import("@/components/dashboard/upgrade-dialog").then(mod => ({ default: mod.UpgradeDialog })), {
  ssr: false,
})

export default async function DashboardPage() {
  // Get session from headers
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  
  if (!session || !session.user || !session.user.id) {
    redirect("/login")
  }

  // Safely extract session data with defaults
  const userId = session.user.id
  const userEmail = session.user.email || ""
  const userName = session.user.name || undefined

  // Get or create user in our database
  let user = await db.users.findById(userId)
  if (!user) {
    try {
      // Create user in our database if they don't exist (first time accessing dashboard)
      // Use the Better Auth user ID
      user = await db.users.create(
        {
          email: userEmail,
          name: userName,
          plan: "free",
          bandwidthLimit: 100 * 1024 * 1024, // 100MB default
        },
        userId // Use Better Auth's user ID
      )
      // Set first user as admin
      const allUsers = await db.users.findAll()
      if (allUsers.length === 1) {
        user = await db.users.update(user.id, { role: "admin" })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      // If user creation fails, redirect to login
      redirect("/login")
    }
  }

  // Allow admins to access dashboard in preview mode
  // They can access it via the "Preview User Mode" button in admin sidebar
  // Only redirect if they're directly accessing /dashboard without coming from admin
  // For now, we'll allow admins to access dashboard
  // The admin sidebar has a "Preview User Mode" button that links to /dashboard

  // Safely get user data with defaults
  const jingles = (await db.jingles.findByUserId(userId)) || []
  const coverArts = (await db.coverArts.findByUserId(userId)) || []
  
  // Ensure user has all required fields with safe defaults
  const safeUser = {
    ...user,
    name: user.name || user.email || userName || "User",
    email: user.email || userEmail || "",
    plan: user.plan || "free",
    bandwidthUsed: user.bandwidthUsed ?? 0,
    bandwidthLimit: user.bandwidthLimit ?? (100 * 1024 * 1024), // 100MB default
    role: user.role || "user",
    banned: user.banned ?? false,
    planExpiresAt: user.planExpiresAt || undefined,
  }

  const isPro = isProPlan(safeUser.plan)
  const maxJingles = getMaxJingles(safeUser.plan)
  const maxCoverArts = getMaxCoverArts(safeUser.plan)

  const formatBytes = (bytes: number | undefined | null) => {
    if (bytes === undefined || bytes === null) return "0 B"
    if (bytes === Infinity) return "Unlimited"
    if (bytes === 0) return "0 B"
    if (isNaN(bytes) || bytes < 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const bandwidthUsed = formatBytes(safeUser.bandwidthUsed)
  const bandwidthLimit = formatBytes(safeUser.bandwidthLimit)
  const bandwidthPercent = safeUser.bandwidthLimit === Infinity || !safeUser.bandwidthLimit || safeUser.bandwidthLimit === 0
    ? 0 
    : Math.min(100, (safeUser.bandwidthUsed / safeUser.bandwidthLimit) * 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            Welcome back, <span className="font-medium text-foreground">{safeUser.name || safeUser.email}</span>!
          </p>
        </div>
        {!isPro && (
          <UpgradeDialog />
        )}
      </div>

      {/* Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription plan and limits</CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className="text-lg px-4 py-2">
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Jingles</div>
              <div className="text-2xl font-bold">
                {jingles.length} / {maxJingles === Infinity ? "∞" : maxJingles}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Cover Arts</div>
              <div className="text-2xl font-bold">
                {coverArts.length} / {maxCoverArts === Infinity ? "∞" : maxCoverArts}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Bandwidth</div>
              <div className="text-2xl font-bold">
                {bandwidthUsed} / {bandwidthLimit}
              </div>
              {safeUser.bandwidthLimit !== Infinity && safeUser.bandwidthLimit > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(Math.max(bandwidthPercent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {safeUser.planExpiresAt && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Plan expires: {new Date(safeUser.planExpiresAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jingles</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jingles.length}</div>
            <p className="text-xs text-muted-foreground">
              {jingles.length >= maxJingles ? "Limit reached" : `${maxJingles - jingles.length} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cover Arts</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverArts.length}</div>
            <p className="text-xs text-muted-foreground">
              {maxCoverArts === Infinity 
                ? "Unlimited" 
                : coverArts.length >= maxCoverArts 
                ? "Limit reached" 
                : `${maxCoverArts - coverArts.length} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bandwidthUsed}</div>
            <p className="text-xs text-muted-foreground">
              of {bandwidthLimit} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isPro ? "Pro" : "Free"}</div>
            <p className="text-xs text-muted-foreground">
              {isPro ? "Full features" : "Limited features"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Upload Jingle</CardTitle>
            <CardDescription>Add a new jingle to your library</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/dashboard/jingles">Go to Jingles</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Add Cover Art</CardTitle>
            <CardDescription>Upload custom cover art images</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/dashboard/cover-art">Go to Cover Art</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Mix Audio</CardTitle>
            <CardDescription>Create a new audio mix</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/dashboard/mixer">Go to Mixer</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
