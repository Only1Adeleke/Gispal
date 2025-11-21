"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Get redirect URL from query params, but admins should go to /admin
  const redirectParam = searchParams.get("redirect")
  const redirectTo = redirectParam || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Attempting login for:", email)
      const result = await signIn.email({
        email,
        password,
      })

      console.log("Login result:", result)

      // Check for errors
      if (result?.error) {
        console.error("Login error:", result.error)
        setError(result.error.message || "Login failed. Please check your credentials.")
        setLoading(false)
        return
      }

      // Check if we have a successful response
      // Better Auth returns { data: { user, session } } on success
      if (result?.data) {
        console.log("Login successful, checking user role...")
        // Check if user is admin and redirect accordingly
        // Fetch user data to check role
        try {
          const userResponse = await fetch("/api/user/plan")
          if (userResponse.ok) {
            const userData = await userResponse.json()
            const finalRedirect = userData.role === "admin" ? "/admin" : redirectTo
            console.log("Redirecting to:", finalRedirect)
            setTimeout(() => {
              window.location.href = finalRedirect
            }, 500)
          } else {
            // Fallback to original redirect
            setTimeout(() => {
              window.location.href = redirectTo
            }, 500)
          }
        } catch (err) {
          // Fallback to original redirect
          setTimeout(() => {
            window.location.href = redirectTo
          }, 500)
        }
      } else {
        // If no error and no data, something unexpected happened
        console.warn("Unexpected login result structure:", result)
        setError("Login response was unexpected. Please check the console for details.")
        setLoading(false)
      }
    } catch (err: any) {
      console.error("Login exception:", err)
      setError(err.message || "An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

