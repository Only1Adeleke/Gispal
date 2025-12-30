"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart3 } from "lucide-react"

interface BreakdownItem {
  feature: string
  requests: number
  percentage: number
  metadata?: {
    prefix?: string
    status?: "active" | "revoked" | "expired"
  }
}

interface UsageBreakdownProps {
  title: string
  data: BreakdownItem[]
  emptyMessage: string
}

export function UsageBreakdown({ title, data, emptyMessage }: UsageBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-zinc-500">Usage distribution breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="h-8 w-8 text-zinc-500" />}
            title="No data available"
            description={emptyMessage}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-zinc-500">Usage distribution breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="group p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-violet-500/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-violet-100 transition-colors">
                    {item.feature}
                  </span>
                  {item.metadata?.status && (
                    <Badge
                      variant={
                        item.metadata.status === "active"
                          ? "default"
                          : item.metadata.status === "revoked"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.metadata.status}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {item.requests.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">{item.percentage}%</div>
                </div>
              </div>
              <Progress
                value={item.percentage}
                className="h-2 bg-zinc-800/50"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

