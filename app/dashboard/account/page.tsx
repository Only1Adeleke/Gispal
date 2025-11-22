"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamic import for client component
const UpgradeDialog = dynamic(() => import("@/components/dashboard/upgrade-dialog").then(mod => ({ default: mod.UpgradeDialog })), {
  ssr: false,
})
import { LogOut, User, CreditCard, Key } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserData {
  name?: string
  email: string
  plan: string
  planExpiresAt?: string
  apiKey?: string
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/plan")
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      toast.error("Failed to fetch user data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" })
      router.push("/login")
    } catch (error) {
      toast.error("Failed to logout")
    }
  }

  const isPro = userData?.plan !== "free"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground mt-1.5">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userData?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={userData?.name || ""} disabled />
            </div>
            <Button variant="outline" disabled>
              Update Profile (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
            <CardDescription>Your current plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isPro ? "default" : "secondary"} className="text-lg px-4 py-2">
                  {isPro ? "Pro" : "Free"}
                </Badge>
              </div>
            </div>
            {userData?.planExpiresAt && (
              <div className="space-y-2">
                <Label>Plan Expires</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(userData.planExpiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {!isPro && (
              <div className="pt-4">
                <UpgradeDialog />
              </div>
            )}
            {isPro && (
              <Button variant="outline" asChild>
                <a href="/dashboard/billing">Manage Billing</a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key
            </CardTitle>
            <CardDescription>For WordPress plugin integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData?.apiKey ? (
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value={userData.apiKey.substring(0, 20) + "..."} disabled />
                  <Button variant="outline" asChild>
                    <a href="/dashboard/settings">Manage</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No API key generated yet.
                </p>
                <Button variant="outline" asChild>
                  <a href="/dashboard/settings">Generate API Key</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Billing history will appear here</p>
              <p className="text-sm mt-2">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

