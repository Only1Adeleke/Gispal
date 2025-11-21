"use client"

import { useState, useEffect } from "react"
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
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Loader2, Music, Sliders } from "lucide-react"
import Link from "next/link"

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
}

export default function MixPage() {
  const router = useRouter()
  const params = useParams()
  const audioId = params.id as string

  const [audio, setAudio] = useState<Audio | null>(null)
  const [jingles, setJingles] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [mixing, setMixing] = useState(false)
  const [volume, setVolume] = useState([100])

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audio) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mix Audio</h1>
        <p className="text-muted-foreground">
          Add a jingle to your audio track
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio to Mix</CardTitle>
          <CardDescription>
            Selected audio track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{audio.title}</p>
            <p className="text-sm text-muted-foreground">
              Duration: {formatDuration(audio.duration)}
            </p>
          </div>
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
              <Label htmlFor="jingleId">Select Jingle *</Label>
              <Select
                onValueChange={(value) => setValue("jingleId", value)}
                disabled={mixing}
              >
                <SelectTrigger id="jingleId">
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
                        {jingle.title} ({formatDuration(jingle.duration)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.jingleId && (
                <p className="text-sm text-red-600">
                  {errors.jingleId.message?.toString()}
                </p>
              )}
              {jingles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No other audio files available. Upload more audio files to use as jingles.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={position}
                onValueChange={(value) => setValue("position", value as "start" | "middle" | "end" | "start-end")}
                disabled={mixing}
              >
                <SelectTrigger id="position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                  <SelectItem value="start-end">Start & End</SelectItem>
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-sm text-red-600">
                  {errors.position.message?.toString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {position === "start" && "Jingle will play at the beginning of the track"}
                {position === "middle" && "Jingle will play in the middle of the track"}
                {position === "end" && "Jingle will play at the end of the track"}
                {position === "start-end" && "Jingle will play at both the start and end of the track"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Volume: {volume[0]}%</Label>
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
                className="w-full"
              />
              {errors.volume && (
                <p className="text-sm text-red-600">
                  {errors.volume.message?.toString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Adjust the volume of the jingle (0-100%)
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mixing || jingles.length === 0}>
                {mixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

