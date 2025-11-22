"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "sonner"
import { ExternalLink, Loader2, Music } from "lucide-react"

const ingestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  source: z.enum(["mp3-url", "youtube", "audiomack"], {
    required_error: "Please select a source",
  }),
  title: z.string().optional(),
  tags: z.string().optional(),
})

type IngestFormData = z.infer<typeof ingestSchema>

export default function UploadExternalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<IngestFormData>({
    resolver: zodResolver(ingestSchema),
    defaultValues: {
      source: "mp3-url",
    },
  })

  const source = watch("source")

  const onSubmit = async (data: IngestFormData) => {
    setLoading(true)
    try {
      const response = await fetch("/api/audio/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: data.source,
          url: data.url,
          title: data.title || undefined,
          tags: data.tags || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to ingest audio")
      }

      const result = await response.json()
      toast.success("Audio ingested successfully!")
      reset()
      router.push("/dashboard/library")
    } catch (error: any) {
      console.error("Ingest error:", error)
      toast.error(error.message || "Failed to ingest audio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload External Audio</h1>
        <p className="text-muted-foreground mt-1.5">
          Import audio from external sources like YouTube, MP3 URLs, or Audiomack
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingest Audio from URL</CardTitle>
          <CardDescription>
            Paste a URL to download and import audio into your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select
                value={source}
                onValueChange={(value) => setValue("source", value as "mp3-url" | "youtube" | "audiomack")}
                disabled={loading}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3-url">MP3 Direct URL</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="audiomack">Audiomack</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-sm text-red-600">
                  {errors.source.message?.toString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {source === "mp3-url" && "Enter a direct link to an MP3 file"}
                {source === "youtube" && "Enter a YouTube video URL"}
                {source === "audiomack" && "Enter an Audiomack track URL (e.g., https://audiomack.com/artist/song)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder={
                  source === "mp3-url"
                    ? "https://example.com/audio.mp3"
                    : source === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://audiomack.com/artist/song"
                }
                {...register("url")}
                disabled={loading}
              />
              {errors.url && (
                <p className="text-sm text-red-600">
                  {errors.url.message?.toString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter audio title"
                {...register("title")}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                {source === "youtube" && "If not provided, the video title will be used."}
                {source !== "youtube" && "If not provided, a default title will be used."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., music, podcast, interview"
                {...register("tags")}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple tags with commas.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ingest Audio
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/library")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-semibold">MP3 Direct URL</h3>
              <p className="text-sm text-muted-foreground">
                Direct links to MP3 files hosted on any server. The file will be downloaded and saved to your library.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-semibold">YouTube</h3>
              <p className="text-sm text-muted-foreground">
                Extract audio from YouTube videos. The video title and metadata will be automatically imported.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-semibold">Audiomack</h3>
              <p className="text-sm text-muted-foreground">
                Import tracks from Audiomack. Supports both songs and albums. OAuth credentials can be configured via environment variables for private tracks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

