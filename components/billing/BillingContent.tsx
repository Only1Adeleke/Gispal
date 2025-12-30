"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import type { ServerPaymentPlan, ServerUserSubscription } from "@/lib/server/subscriptions"

interface BillingContentProps {
  plans: ServerPaymentPlan[]
  subscription: ServerUserSubscription | null
}

export function BillingContent({ plans, subscription }: BillingContentProps) {
  const handleUpgrade = (plan: ServerPaymentPlan) => {
    if (plan.raenestLink) {
      window.open(plan.raenestLink, "_blank")
    } else {
      alert("Payment link not configured. Please contact support.")
    }
  }

  return (
    <>
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription and rate limits</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                    <Badge
                      variant={
                        subscription.status === "active"
                          ? "default"
                          : subscription.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {subscription.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {subscription.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {subscription.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{subscription.plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₦{subscription.plan.priceNgn.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Rate Limit (per minute)</div>
                  <div className="text-lg font-semibold">{subscription.plan.rateLimitPerMin.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate Limit (per day)</div>
                  <div className="text-lg font-semibold">{subscription.plan.rateLimitPerDay.toLocaleString()}</div>
                </div>
              </div>

              {subscription.expiresAt && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {subscription.status === "active" ? "Expires" : "Expired"} on{" "}
                    {format(new Date(subscription.expiresAt), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active subscription. Choose a plan below to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade your plan to increase rate limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.planId === plan.id
              const isActive = subscription?.status === "active" && isCurrentPlan

              return (
                <Card key={plan.id} className={isActive ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || ""}</CardDescription>
                    <div className="text-3xl font-bold mt-2">
                      ₦{plan.priceNgn.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/year</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Per Minute</span>
                        <span className="font-semibold">{plan.rateLimitPerMin.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Per Day</span>
                        <span className="font-semibold">{plan.rateLimitPerDay.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={isActive ? "outline" : "default"}
                      disabled={isActive || !plan.raenestLink}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {isActive ? (
                        "Current Plan"
                      ) : (
                        <>
                          {plan.priceNgn === 0 ? "Get Started" : "Upgrade"}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

