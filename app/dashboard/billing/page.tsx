"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS } from "@/lib/payments/paystack"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)

    try {
      const response = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authorizationUrl
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to initialize payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`
  }

  const formatBandwidth = (bandwidth: number | "unlimited") => {
    if (bandwidth === "unlimited") return "Unlimited"
    const mb = bandwidth / (1024 * 1024)
    return `${mb} MB`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-600 mt-2">Choose a plan that works for you</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.interval.charAt(0).toUpperCase() + plan.interval.slice(1)} plan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <div className="text-3xl font-bold">{formatPrice(plan.amount)}</div>
                <div className="text-sm text-gray-600">per {plan.interval}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm">Bandwidth: {formatBandwidth(plan.bandwidth)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Processing..." : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

