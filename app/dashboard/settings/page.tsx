"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        toast({
          title: "Success",
          description: "API key generated successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to generate API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRotate = async () => {
    if (!confirm("Are you sure you want to rotate your API key? The old key will no longer work.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        toast({
          title: "Success",
          description: "API key rotated successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to rotate API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate API key",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>
            Generate or rotate your API key for WordPress plugin integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Save this API key now. You won't be able to see it again.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRotate} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rotate API Key
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                You don't have an API key yet. Generate one to start using the WordPress plugin.
              </p>
              <Button onClick={handleGenerate} disabled={loading}>
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

