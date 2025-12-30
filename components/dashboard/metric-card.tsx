import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  gradient?: "blue" | "purple" | "green" | "orange"
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  gradient = "blue",
  className,
}: MetricCardProps) {
  const gradientClasses = {
    blue: "from-blue-500/10 via-blue-500/5 to-transparent",
    purple: "from-purple-500/10 via-purple-500/5 to-transparent",
    green: "from-green-500/10 via-green-500/5 to-transparent",
    orange: "from-orange-500/10 via-orange-500/5 to-transparent",
  }

  const iconClasses = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    orange: "text-orange-400",
  }

  return (
    <Card className={cn("relative overflow-hidden border-border/50", className)}>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          gradientClasses[gradient]
        )}
      />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-400" : "text-red-400"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("rounded-lg bg-background/50 p-3", iconClasses[gradient])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

