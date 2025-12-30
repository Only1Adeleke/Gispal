"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Upload, Music, Clock, Check, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type JinglePlacement = "intro" | "midroll" | "outro"

export interface JingleConfig {
  source: "default" | "upload" | "custom"
  jingleId?: string
  file?: File
  placement: JinglePlacement
  midrollTimestamp?: number // in seconds
}

interface Jingle {
  id: string
  name: string
}

interface JingleConfigCardProps {
  value: JingleConfig
  onChange: (config: JingleConfig) => void
  jingles?: Jingle[]
}

interface UserPlan {
  plan: string
  jingleCount: number
  maxJingles: number
}

export function JingleConfigCard({ value, onChange, jingles = [] }: JingleConfigCardProps) {
  const [jingleList, setJingleList] = useState<Jingle[]>(jingles)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)

  useEffect(() => {
    if (jingles.length === 0) {
      // Fetch jingles
      fetch("/api/jingles")
        .then((res) => res.json())
        .then((data) => setJingleList(data || []))
        .catch(() => {})
    }
    
    // Fetch user plan
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        setUserPlan(data)
        setLoadingPlan(false)
      })
      .catch(() => {
        setUserPlan({ plan: "free", jingleCount: 0, maxJingles: 1 })
        setLoadingPlan(false)
      })
  }, [jingles])
  
  const isPro = userPlan?.plan !== "free"

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlacementChange = (placement: JinglePlacement) => {
    onChange({
      ...value,
      placement,
      midrollTimestamp: placement === "midroll" ? value.midrollTimestamp || 30 : undefined,
    })
  }

  // FREE PLAN: Show simplified, automatic UI
  if (!loadingPlan && !isPro) {
    return (
      <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Jingle</CardTitle>
              <CardDescription className="text-zinc-500">Automatically applied to your audio</CardDescription>
            </div>
            <Badge variant="outline" className="border-violet-500/50 text-violet-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Included
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
            <div className="mt-0.5">
              <Check className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">Brand jingle applied automatically</p>
              <p className="text-xs text-zinc-500">
                Your jingle will be added at the start of your audio. No setup required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // PAID PLAN: Show full controls with automatic defaults
  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jingle Configuration</CardTitle>
            <CardDescription className="text-zinc-500">
              Your latest uploaded jingle is used by default
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Preview jingle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Default Placements Info (PAID only) */}
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">Default placements enabled</span>
          </div>
          <p className="text-xs text-zinc-400 ml-6">
            Intro and outro are automatically applied. Add midroll below if needed.
          </p>
        </div>

        {/* Override Jingle (Advanced - PAID only) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="jingle-source" className="text-sm text-zinc-400">Override jingle (optional)</Label>
            <Badge variant="outline" className="text-xs">Advanced</Badge>
          </div>
          <Select
            value={value.source}
            onValueChange={(v: "default" | "upload" | "custom") => {
              onChange({
                ...value,
                source: v,
                jingleId: v === "default" ? undefined : value.jingleId,
              })
            }}
          >
            <SelectTrigger id="jingle-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Use default brand jingle</SelectItem>
              <SelectItem value="custom">Select from library</SelectItem>
              <SelectItem value="upload">Upload new jingle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Jingle Select */}
        {value.source === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="jingle-select">Select Jingle</Label>
            <Select
              value={value.jingleId || "no-jingle-selected"}
              onValueChange={(v) => {
                if (v !== "no-jingle-selected") {
                  onChange({ ...value, jingleId: v })
                } else {
                  onChange({ ...value, jingleId: undefined })
                }
              }}
            >
              <SelectTrigger id="jingle-select">
                <SelectValue placeholder="Choose a jingle" />
              </SelectTrigger>
              <SelectContent>
                {jingleList.length === 0 ? (
                  <SelectItem value="no-jingles-available" disabled>
                    No jingles available
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="no-jingle-selected">None</SelectItem>
                    {jingleList.map((jingle) => (
                      <SelectItem key={jingle.id} value={jingle.id}>
                        {jingle.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Upload Jingle */}
        {value.source === "upload" && (
          <div className="space-y-2">
            <Label>Upload Jingle</Label>
            <Button
              variant="outline"
              className="w-full border-zinc-800/50 hover:bg-zinc-900/50"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "audio/*"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    onChange({ ...value, file })
                  }
                }
                input.click()
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </Button>
            {value.file && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <Music className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-foreground flex-1">{value.file.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Midroll Toggle (PAID only - optional) */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="midroll-toggle" className="text-sm">Add midroll jingle</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-zinc-500 cursor-help text-xs">ℹ️</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Add a jingle at a specific timestamp during your audio. Intro and outro are already included.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant={value.placement === "midroll" ? "default" : "outline"} className="text-xs">
              {value.placement === "midroll" ? "Enabled" : "Optional"}
            </Badge>
          </div>
          <Button
            type="button"
            variant={value.placement === "midroll" ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => {
              onChange({
                ...value,
                placement: value.placement === "midroll" ? "intro" : "midroll",
                midrollTimestamp: value.placement === "midroll" ? undefined : (value.midrollTimestamp || 30),
              })
            }}
          >
            {value.placement === "midroll" ? "Remove midroll" : "Add midroll jingle"}
          </Button>
        </div>

        {/* Midroll Timestamp (only show when midroll is enabled) */}
        {value.placement === "midroll" && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center justify-between">
              <Label htmlFor="midroll-timestamp">Midroll timestamp (mm:ss)</Label>
              <Badge variant="outline" className="text-xs">
                {formatTime(value.midrollTimestamp || 30)}
              </Badge>
            </div>
            <Slider
              id="midroll-timestamp"
              min={0}
              max={600}
              step={1}
              value={[value.midrollTimestamp || 30]}
              onValueChange={([val]) => onChange({ ...value, midrollTimestamp: val })}
              className="w-full"
            />
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              <span>Set when the midroll jingle should play during the track</span>
            </div>
          </div>
        )}

        {/* Preview */}
        {value.jingleId && (
          <div className="pt-2 border-t border-zinc-800/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-zinc-800/50 hover:bg-zinc-900/50"
            >
              <Play className="h-4 w-4 mr-2" />
              Preview Jingle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

