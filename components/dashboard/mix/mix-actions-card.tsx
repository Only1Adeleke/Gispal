"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, Save, Loader2, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AudioSource } from "./audio-source-card"
import type { JingleConfig } from "./jingle-config-card"
import type { AudioMetadata } from "./metadata-editor"

interface MixActionsCardProps {
  audioSource: AudioSource | null
  jingleConfig: JingleConfig | null
  metadata: AudioMetadata
  onMix: () => void
  onReset: () => void
  mixing?: boolean
  disabled?: boolean
}

export function MixActionsCard({
  audioSource,
  jingleConfig,
  metadata,
  onMix,
  onReset,
  mixing = false,
  disabled = false,
}: MixActionsCardProps) {
  const isValid =
    audioSource &&
    (audioSource.url || audioSource.file) &&
    metadata.title.trim() &&
    metadata.artist.trim()

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription className="text-zinc-500">Generate your mixed audio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onMix}
          disabled={!isValid || mixing || disabled}
          className={cn(
            "w-full h-12 text-base font-semibold transition-all duration-200",
            "bg-violet-600 hover:bg-violet-700 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:shadow-lg hover:shadow-violet-500/20"
          )}
        >
          {mixing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Mixed Audio...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Generate Mixed Audio
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={mixing}
            className="flex-1 border-zinc-800/50 hover:bg-zinc-900/50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Workflow
          </Button>
          <Button
            variant="outline"
            disabled
            className="flex-1 border-zinc-800/50 opacity-50 cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Preset
          </Button>
        </div>

        {!isValid && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">
              Complete all required fields (audio source, title, artist) to generate mixed audio.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

