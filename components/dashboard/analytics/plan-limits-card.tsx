"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Gauge, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PlanLimits } from "@/lib/server/analytics"

interface PlanLimitsCardProps {
  limits: PlanLimits
}

export function PlanLimitsCard({ limits }: PlanLimitsCardProps) {
  const dailyPercentage = (limits.usedToday / limits.rateLimitPerDay) * 100
  const monthlyEstimate = limits.usedThisMonth
  const isNearLimit = dailyPercentage >= 80
  const isAtLimit = dailyPercentage >= 95

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plan Limits & Usage</CardTitle>
            <CardDescription className="text-zinc-500">
              Monitor your current plan limits and avoid rate limiting
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {limits.planName} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Rate Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400">Daily Rate Limit</span>
            </div>
            <span className={cn(
              "font-medium",
              isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-foreground"
            )}>
              {limits.usedToday.toLocaleString()} / {limits.rateLimitPerDay.toLocaleString()}
            </span>
          </div>
          <Progress
            value={dailyPercentage}
            className={cn(
              "h-2",
              isAtLimit ? "bg-red-500/20" : isNearLimit ? "bg-yellow-500/20" : "bg-zinc-800/50"
            )}
          />
          <p className="text-xs text-zinc-500">
            {limits.rateLimitPerMinute} requests per minute, {limits.rateLimitPerDay.toLocaleString()} per day
          </p>
        </div>

        {/* Monthly Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400">This Month</span>
            </div>
            <span className="font-medium text-foreground">
              {monthlyEstimate.toLocaleString()} requests
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Estimated monthly consumption based on current usage patterns
          </p>
        </div>

        {/* Storage (if applicable) */}
        {typeof limits.storageLimit === "number" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Storage</span>
              <span className="font-medium text-foreground">
                {limits.storageUsed} MB / {limits.storageLimit} MB
              </span>
            </div>
            <Progress
              value={(limits.storageUsed / limits.storageLimit) * 100}
              className="h-2 bg-zinc-800/50"
            />
          </div>
        )}

        {/* Warnings */}
        {limits.limitWarnings.length > 0 && (
          <Alert className={cn(
            "border-zinc-800/50",
            isAtLimit ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4",
              isAtLimit ? "text-red-400" : "text-yellow-400"
            )} />
            <AlertDescription className="text-sm">
              {limits.limitWarnings.map((warning, index) => (
                <p key={index} className={cn(
                  isAtLimit ? "text-red-300" : "text-yellow-300"
                )}>
                  {warning}
                </p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade CTA */}
        {isNearLimit && (
          <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            <Link href="/dashboard/billing">Upgrade Plan</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

