"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { Loader2, Music, Sliders, ArrowLeft, Copy, Edit } from "lucide-react"
import { MetadataDialog } from "@/components/audio/MetadataDialog"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic import with SSR disabled for AudioPlayer
const AudioPlayer = dynamic(() => import("@/components/audio/Player").then(mod => ({ default: mod.AudioPlayer })), {
  ssr: false,
  loading: () => (
    <Card className="p-4">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </Card>
  ),
})

const mixSchema = z.object({
  jingleId: z.string().min(1, "Please select a jingle"),
  position: z.enum(["start", "middle", "end", "start-end"], {
    required_error: "Please select a position",
  }),
  volume: z.number().min(0).max(100),
})

type MixFormData = z.infer<typeof mixSchema>

interface Audio {
  id: string
  title: string
  tags: string | null
  url: string
  duration: number | null
  createdAt: string
  artist?: string
  album?: string
  producer?: string
  year?: string
}

interface Jingle {
  id: string
  name: string
  fileUrl: string
  fileSize: number
  duration?: number
  createdAt: string
}

export default function MixPage() {
  const router = useRouter()
  const params = useParams()
  const audioId = params.id as string

  const [audio, setAudio] = useState<Audio | null>(null)
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [loading, setLoading] = useState(true)
  const [mixing, setMixing] = useState(false)
  const [volume, setVolume] = useState([100])
  const [metadataOpen, setMetadataOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MixFormData>({
    resolver: zodResolver(mixSchema),
    defaultValues: {
      position: "start",
      volume: 100,
    },
  })

  const position = watch("position")

  useEffect(() => {
    fetchAudio()
    fetchJingles()
  }, [audioId])

  const fetchAudio = async () => {
    try {
      const response = await fetch("/api/audio")
      if (!response.ok) {
        throw new Error("Failed to fetch audio")
      }
      const audios = await response.json()
      const found = audios.find((a: Audio) => a.id === audioId)
      if (!found) {
        toast.error("Audio not found")
        router.push("/dashboard/library")
        return
      }
      setAudio(found)
    } catch (error: any) {
      console.error("Error fetching audio:", error)
      toast.error(error.message || "Failed to load audio")
      router.push("/dashboard/library")
    } finally {
      setLoading(false)
    }
  }

  const fetchJingles = async () => {
    try {
      const response = await fetch("/api/audio")
      if (!response.ok) {
        throw new Error("Failed to fetch jingles")
      }
      const audios = await response.json()
      // Filter out the current audio from jingles list
      setJingles(audios.filter((a: Audio) => a.id !== audioId))
    } catch (error: any) {
      console.error("Error fetching jingles:", error)
      toast.error("Failed to load jingles")
    }
  }

  const onSubmit = async (data: MixFormData) => {
    setMixing(true)
    try {
      const response = await fetch("/api/audio/mix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioId,
          jingleId: data.jingleId,
          position: data.position,
          volume: data.volume / 100, // Convert 0-100 to 0.0-1.0
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to mix audio")
      }

      const result = await response.json()
      toast.success("Audio mixed successfully!")
      router.push("/dashboard/library")
    } catch (error: any) {
      console.error("Mix error:", error)
      toast.error(error.message || "Failed to mix audio")
    } finally {
      setMixing(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!audio) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/library")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mix Audio</h1>
          <p className="text-muted-foreground mt-1.5">
            Add a jingle to your audio track
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio to Mix</CardTitle>
          <CardDescription>
            Preview the original audio track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{audio.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMetadataOpen(true)}
              title="Edit Metadata"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <AudioPlayer
            src={audio.url}
            title={audio.title}
            showWaveform={true}
            className="mb-4"
          />
          <Button
            variant="outline"
            onClick={() => {
              const embedCode = `<audio src="${audio.url}" controls></audio>`
              navigator.clipboard.writeText(embedCode)
              toast.success("Embed code copied to clipboard")
            }}
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Embed Code
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mix Settings</CardTitle>
          <CardDescription>
            Configure jingle position and volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="jingleId" className="text-base font-medium">
                Select Jingle <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("jingleId", value)}
                disabled={mixing}
              >
                <SelectTrigger id="jingleId" className="max-w-md">
                  <SelectValue placeholder="Choose a jingle" />
                </SelectTrigger>
                <SelectContent>
                  {jingles.length === 0 ? (
                    <SelectItem value="" disabled>
                      No jingles available
                    </SelectItem>
                  ) : (
                    jingles.map((jingle) => (
                      <SelectItem key={jingle.id} value={jingle.id}>
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <span>{jingle.name}</span>
                          <Badge variant="outline" className="ml-auto font-mono text-xs">
                            {formatDuration(jingle.duration || null)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.jingleId && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span>
                  {errors.jingleId.message?.toString()}
                </p>
              )}
              {jingles.length === 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    No other audio files available. Upload more audio files to use as jingles.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="position" className="text-base font-medium">
                Position <span className="text-destructive">*</span>
              </Label>
              <TooltipProvider>
                <RadioGroup
                  value={position}
                  onValueChange={(value) => setValue("position", value as "start" | "middle" | "end" | "start-end")}
                  disabled={mixing}
                  className="grid grid-cols-2 gap-4"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="start" id="start" />
                        <Label htmlFor="start" className="cursor-pointer flex-1">
                          <div className="font-medium">Start</div>
                          <div className="text-xs text-muted-foreground">Beginning</div>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jingle will play at the beginning of the track</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="middle" id="middle" />
                        <Label htmlFor="middle" className="cursor-pointer flex-1">
                          <div className="font-medium">Middle</div>
                          <div className="text-xs text-muted-foreground">Center</div>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jingle will play in the middle of the track</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="end" id="end" />
                        <Label htmlFor="end" className="cursor-pointer flex-1">
                          <div className="font-medium">End</div>
                          <div className="text-xs text-muted-foreground">Conclusion</div>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jingle will play at the end of the track</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="start-end" id="start-end" />
                        <Label htmlFor="start-end" className="cursor-pointer flex-1">
                          <div className="font-medium">Start & End</div>
                          <div className="text-xs text-muted-foreground">Both</div>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jingle will play at both the start and end of the track</p>
                    </TooltipContent>
                  </Tooltip>
                </RadioGroup>
              </TooltipProvider>
              {errors.position && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span>
                  {errors.position.message?.toString()}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="volume" className="text-base font-medium cursor-help">
                        Volume
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjust the volume of the jingle relative to the main audio</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="outline" className="font-mono">
                  {volume[0]}%
                </Badge>
              </div>
              <Slider
                id="volume"
                min={0}
                max={100}
                step={1}
                value={volume}
                onValueChange={(value) => {
                  setVolume(value)
                  setValue("volume", value[0])
                }}
                disabled={mixing}
                className="w-full max-w-md"
              />
              {errors.volume && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span>
                  {errors.volume.message?.toString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Adjust the volume of the jingle (0-100%)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mixing || jingles.length === 0} size="lg">
                {mixing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Mixing...
                  </>
                ) : (
                  <>
                    <Sliders className="mr-2 h-4 w-4" />
                    Mix Audio
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/library")}
                disabled={mixing}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        audio={audio}
        onUpdate={() => {
          fetchAudio()
        }}
      />
    </div>
  )
}

