"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Insight } from "@/lib/server/analytics-insights"

interface InsightCardProps {
  insight: Insight
}

const iconMap = {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
}

const impactStyles = {
  Positive: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
  },
  Warning: {
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "text-red-400",
    border: "border-red-500/20",
    glow: "group-hover:shadow-red-500/10",
  },
  "Cost Driver": {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
  },
  Optimization: {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    icon: "text-violet-400",
    border: "border-violet-500/20",
    glow: "group-hover:shadow-violet-500/10",
  },
}

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = iconMap[insight.icon]
  const styles = impactStyles[insight.impact]

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-zinc-700/50 hover:shadow-lg",
        styles.border,
        styles.glow
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "rounded-lg p-2.5 border transition-all duration-300",
              styles.border,
              "group-hover:scale-105"
            )}
          >
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", styles.badge)}
              >
                {insight.impact}
              </Badge>
            </div>

            {/* CTA */}
            {insight.cta && (
              <div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50",
                    styles.border,
                    "hover:border-opacity-50 transition-all"
                  )}
                >
                  <a href={insight.cta.href}>{insight.cta.label}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

