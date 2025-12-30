"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Info, Activity, Zap, Download, HardDrive } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const iconMap = {
  Activity,
  Zap,
  Download,
  HardDrive,
} as const

type IconName = keyof typeof iconMap

interface AnalyticsKPICardProps {
  title: string
  value: string | number
  previous: number
  trend: number
  icon: IconName
  tooltip?: string
}

export function AnalyticsKPICard({
  title,
  value,
  previous,
  trend,
  icon,
  tooltip,
}: AnalyticsKPICardProps) {
  const Icon = iconMap[icon]
  const isPositive = trend >= 0
  const trendColor = isPositive ? "text-emerald-400" : "text-red-400"

  return (
    <TooltipProvider>
      <Card className="group relative overflow-hidden rounded-2xl border-zinc-800/50 bg-gradient-to-br from-zinc-950/50 via-zinc-900/30 to-violet-950/10 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {title}
            </CardTitle>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-zinc-500 hover:text-violet-400 transition-colors">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="rounded-lg bg-violet-500/10 p-2 border border-violet-500/20 group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-all duration-300">
            <Icon className="h-4 w-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold tracking-tight text-foreground group-hover:text-violet-100 transition-colors">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-zinc-500">vs previous period</p>
            {previous > 0 && (
              <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

