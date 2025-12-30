"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { AudioSourceCard, type AudioSource } from "@/components/dashboard/mix/audio-source-card"
import { JingleConfigCard, type JingleConfig } from "@/components/dashboard/mix/jingle-config-card"
import { MetadataEditor, type AudioMetadata } from "@/components/dashboard/mix/metadata-editor"
import { MixSummaryCard } from "@/components/dashboard/mix/mix-summary-card"
import { MixActionsCard } from "@/components/dashboard/mix/mix-actions-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { HelpCircle, BookOpen, Download, Copy, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

const DEFAULT_JINGLE_CONFIG: JingleConfig = {
  source: "default",
  placement: "intro",
}

const DEFAULT_METADATA: AudioMetadata = {
  title: "",
  artist: "",
  album: "",
  genre: "",
  year: "",
  isrc: "",
  description: "",
  coverArt: {
    type: "auto",
  },
}

export default function MixPage() {
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null)
  const [jingleConfig, setJingleConfig] = useState<JingleConfig>(DEFAULT_JINGLE_CONFIG)
  const [metadata, setMetadata] = useState<AudioMetadata>(DEFAULT_METADATA)
  const [mixing, setMixing] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [defaultCoverArtUrl, setDefaultCoverArtUrl] = useState<string | undefined>(undefined)
  const [autoFilledFields, setAutoFilledFields] = useState<Partial<Record<keyof AudioMetadata, boolean>>>({})
  const { toast } = useToast()

  // Fetch default cover art on mount
  useEffect(() => {
    fetch("/api/cover")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Get default cover art or most recent
          const defaultCover = data.find((c: any) => c.isDefault) || data[data.length - 1]
          if (defaultCover?.fileUrl) {
            setDefaultCoverArtUrl(defaultCover.fileUrl)
          } else if (defaultCover?.url) {
            setDefaultCoverArtUrl(defaultCover.url)
          }
        }
      })
      .catch(() => {
        // Silently fail - default cover art is optional
      })
  }, [])

  const handleMetadataDetected = (detectedMetadata: AudioSource["metadata"]) => {
    if (detectedMetadata?.duration) {
      setAudioDuration(detectedMetadata.duration)
    }
  }

  const handleIngestionStart = () => {
    setMetadataLoading(true)
  }

  const handleIngestionComplete = (ingestedMetadata: AudioSource["metadata"]) => {
    setMetadataLoading(false)
    
    if (!ingestedMetadata) return

    const currentYear = new Date().getFullYear().toString()
    const filledFields: Partial<Record<keyof AudioMetadata, boolean>> = {}

    // Use autoFilled flags from API if available, otherwise infer from values
    const apiAutoFilled = ingestedMetadata.autoFilled || {}

    // Auto-fill metadata from ingested data
    setMetadata((prev) => {
      const updated: AudioMetadata = { ...prev }

      if (ingestedMetadata.title) {
        updated.title = ingestedMetadata.title
        filledFields.title = apiAutoFilled.title ?? true
      }
      if (ingestedMetadata.artist) {
        updated.artist = ingestedMetadata.artist
        filledFields.artist = apiAutoFilled.artist ?? true
      }
      if (ingestedMetadata.album) {
        updated.album = ingestedMetadata.album
        filledFields.album = true
      }
      if (ingestedMetadata.genre) {
        updated.genre = ingestedMetadata.genre
        filledFields.genre = true
      }
      if (ingestedMetadata.year) {
        updated.year = ingestedMetadata.year
        filledFields.year = true
      } else if (!updated.year) {
        // Default to current year if not provided
        updated.year = currentYear
      }
      
      // Handle cover art
      if (ingestedMetadata.coverArtUrl) {
        updated.coverArt = {
          type: "auto",
          url: ingestedMetadata.coverArtUrl,
        }
        filledFields.coverArt = apiAutoFilled.coverArtUrl ?? true
      } else if (defaultCoverArtUrl && !updated.coverArt?.url) {
        // Use default cover art if no auto-detected cover art
        updated.coverArt = {
          type: "default",
          url: defaultCoverArtUrl,
        }
      }

      return updated
    })

    setAutoFilledFields(filledFields)

    if (ingestedMetadata.duration) {
      setAudioDuration(ingestedMetadata.duration)
    }

    toast({
      title: "Metadata extracted",
      description: "Audio metadata has been auto-filled. You can edit any fields as needed.",
    })
  }

  const handleAudioSourceChange = (source: AudioSource | null) => {
    setAudioSource(source)
    if (source) {
      setMetadataLoading(true)
    } else {
      // Reset metadata when source is cleared
      setMetadata(DEFAULT_METADATA)
      setAutoFilledFields({})
      setAudioDuration(undefined)
      setMetadataLoading(false)
    }
  }

  const handleMix = async () => {
    if (!audioSource || (!audioSource.url && !audioSource.file)) {
      toast({
        title: "Error",
        description: "Please provide an audio source",
        variant: "destructive",
      })
      return
    }

    if (!metadata.title.trim() || !metadata.artist.trim()) {
      toast({
        title: "Error",
        description: "Title and Artist are required",
        variant: "destructive",
      })
      return
    }

    setMixing(true)
    setOutputUrl(null)

    try {
      // Prepare form data for file upload
      const formData = new FormData()
      
      if (audioSource.file) {
        formData.append("audioFile", audioSource.file)
      } else if (audioSource.url) {
        formData.append("audioUrl", audioSource.url)
      }

      if (audioSource.type === "youtube") {
        formData.append("sourceType", "youtube")
      } else if (audioSource.type === "url") {
        formData.append("sourceType", "url")
      } else {
        formData.append("sourceType", "upload")
      }

      // Jingle config
      formData.append("jingleSource", jingleConfig.source)
      if (jingleConfig.jingleId) {
        formData.append("jingleId", jingleConfig.jingleId)
      }
      if (jingleConfig.file) {
        formData.append("jingleFile", jingleConfig.file)
      }
      formData.append("jinglePlacement", jingleConfig.placement)
      if (jingleConfig.midrollTimestamp) {
        // Sanitize numeric value
        const safeTimestamp = (() => {
          const n = Number(jingleConfig.midrollTimestamp)
          return Number.isFinite(n) && n >= 0 ? n : 0
        })()
        formData.append("midrollTimestamp", safeTimestamp.toString())
      }

      // Metadata
      formData.append("title", metadata.title)
      formData.append("artist", metadata.artist)
      formData.append("album", metadata.album || "")
      formData.append("genre", metadata.genre || "")
      formData.append("year", metadata.year || "")
      formData.append("isrc", metadata.isrc || "")
      formData.append("description", metadata.description || "")

      // Cover art
      if (metadata.coverArt?.file) {
        formData.append("coverArt", metadata.coverArt.file)
      }

      const response = await fetch("/api/mix", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setOutputUrl(data.outputUrl || data.url)
        toast({
          title: "Success",
          description: "Audio mixed successfully!",
        })
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to mix audio" }))
        toast({
          title: "Error",
          description: error.error || "Failed to mix audio",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mix audio",
        variant: "destructive",
      })
    } finally {
      setMixing(false)
    }
  }

  const handleReset = () => {
    setAudioSource(null)
    setJingleConfig(DEFAULT_JINGLE_CONFIG)
    setMetadata(DEFAULT_METADATA)
    setOutputUrl(null)
    setAudioDuration(undefined)
  }

  const handleCopyLink = () => {
    if (outputUrl) {
      navigator.clipboard.writeText(outputUrl)
      toast({
        title: "Copied",
        description: "Share link copied to clipboard",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mix Audio"
        description="Ingest, brand, and export audio in one workflow"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audio Workflows", href: "/dashboard" },
          { label: "Mix" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Usage: Each mix consumes processing minutes from your plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs">
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </Link>
            </Button>
      </div>
        }
      />

      {/* Post-Generation Success State */}
      {outputUrl && (
        <Card className="rounded-2xl border-violet-500/30 bg-gradient-to-br from-violet-950/20 via-zinc-950/50 to-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Mixed Audio Ready</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Success
              </Badge>
            </CardTitle>
            <CardDescription className="text-zinc-500">Your audio has been processed and is ready to download</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-4">
              <audio controls src={outputUrl} className="w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
                    <a href={outputUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
              <Button variant="outline" onClick={handleCopyLink} className="border-zinc-800/50 hover:bg-zinc-900/50">
                <Copy className="h-4 w-4 mr-2" />
                Copy Share Link
              </Button>
              <Button variant="outline" disabled className="border-zinc-800/50 opacity-50 cursor-not-allowed">
                <Share2 className="h-4 w-4 mr-2" />
                Send to WordPress
              </Button>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Main Workflow */}
      {!outputUrl && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Primary Workflow */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Source Card */}
            <AudioSourceCard
              value={audioSource}
              onChange={setAudioSource}
              onMetadataDetected={handleMetadataDetected}
              onIngestionComplete={handleIngestionComplete}
            />

            {/* Jingle Configuration Card */}
            <JingleConfigCard value={jingleConfig} onChange={setJingleConfig} />

            {/* Metadata Editor Card - Show skeleton while loading, then show editor */}
            <MetadataEditor
              value={metadata}
              onChange={setMetadata}
              autoFilled={autoFilledFields}
              loading={metadataLoading && !audioSource?.metadata}
              defaultCoverArtUrl={defaultCoverArtUrl}
            />
          </div>

          {/* Right Column - Context & Actions */}
          <div className="space-y-6">
            {/* Live Summary Card */}
            <MixSummaryCard
              audioSource={audioSource}
              jingleConfig={jingleConfig}
              audioDuration={audioDuration}
            />

            {/* Actions Card */}
            <MixActionsCard
              audioSource={audioSource}
              jingleConfig={jingleConfig}
              metadata={metadata}
              onMix={handleMix}
              onReset={handleReset}
              mixing={mixing}
            />
          </div>
      </div>
      )}
    </div>
  )
}
