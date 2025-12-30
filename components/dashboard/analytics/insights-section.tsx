import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Brain } from "lucide-react"
import { InsightCard } from "./insight-card"
import { generateInsights } from "@/lib/server/analytics-insights"
import { Skeleton } from "@/components/ui/skeleton"

interface InsightsSectionProps {
  range: "7d" | "30d" | "90d"
}

export async function InsightsSection({ range }: InsightsSectionProps) {
  const insights = await generateInsights(range)

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>Insights & Cost Drivers</CardTitle>
        <CardDescription className="text-zinc-500">
          Automated analysis of usage patterns and billing impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <EmptyState
            icon={<Brain className="h-12 w-12 text-zinc-600" />}
            title="No unusual usage patterns detected"
            description="Your usage is stable and within expected limits."
          />
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function InsightsSectionSkeleton() {
  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

