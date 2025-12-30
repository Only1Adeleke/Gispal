"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Music, Zap, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AudioSource } from "./audio-source-card"
import type { JingleConfig } from "./jingle-config-card"

interface MixSummaryCardProps {
  audioSource: AudioSource | null
  jingleConfig: JingleConfig | null
  audioDuration?: number // in seconds
}

export function MixSummaryCard({ audioSource, jingleConfig, audioDuration }: MixSummaryCardProps) {
  const estimatedProcessingTime = audioDuration ? Math.ceil(audioDuration * 0.1) : null // Rough estimate
  const hasJingle = jingleConfig && (jingleConfig.jingleId || jingleConfig.file)

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>Live Summary</CardTitle>
        <CardDescription className="text-zinc-500">Workflow overview and estimates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Length */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-zinc-400">Audio Length</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {audioDuration ? `${Math.floor(audioDuration / 60)}:${(audioDuration % 60).toFixed(0).padStart(2, "0")}` : "—"}
          </span>
        </div>

        {/* Jingle Placement */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-zinc-400">Jingle Placement</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {hasJingle ? (
              jingleConfig?.placement === "intro"
                ? "Intro"
                : jingleConfig?.placement === "midroll"
                  ? `Midroll (${Math.floor((jingleConfig?.midrollTimestamp || 0) / 60)}:${((jingleConfig?.midrollTimestamp || 0) % 60).toFixed(0).padStart(2, "0")})`
                  : "Outro"
            ) : (
              "None"
            )}
          </Badge>
        </div>

        {/* Estimated Processing Time */}
        {estimatedProcessingTime && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400" />
              <span className="text-sm text-zinc-400">Processing Time</span>
            </div>
            <span className="text-sm font-medium text-foreground">~{estimatedProcessingTime}s</span>
          </div>
        )}

        {/* API Cost Impact */}
        <div className="pt-4 border-t border-zinc-800/50">
          <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-400" />
              <span className="text-sm text-zinc-400">API Cost Impact</span>
            </div>
            <span className="text-xs text-violet-400">Minimal</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Audio mixing consumes from your plan&apos;s processing minutes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MixSummaryCardSkeleton() {
  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

