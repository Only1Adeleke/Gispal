"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import { Upload, Link as LinkIcon, Youtube, FileAudio, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Extract filename from URL (without extension)
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split("/").pop() || ""
    return filename.replace(/\.[^/.]+$/, "") // Remove extension
  } catch {
    return "Untitled"
  }
}

export type AudioSourceType = "upload" | "youtube" | "url"

export interface AudioSource {
  type: AudioSourceType
  url?: string
  file?: File
  metadata?: {
    duration?: number
    bitrate?: number
    format?: string
    title?: string
    artist?: string
    album?: string
    genre?: string
    year?: string
    coverArtUrl?: string
  }
}

interface AudioSourceCardProps {
  value: AudioSource | null
  onChange: (source: AudioSource | null) => void
  onMetadataDetected?: (metadata: AudioSource["metadata"]) => void
  onIngestionComplete?: (metadata: AudioSource["metadata"]) => void
}

export function AudioSourceCard({
  value,
  onChange,
  onMetadataDetected,
  onIngestionComplete,
}: AudioSourceCardProps) {
  const [sourceType, setSourceType] = useState<AudioSourceType>("upload")
  const [urlInput, setUrlInput] = useState("")
  const [youtubeInput, setYoutubeInput] = useState("")
  const [validating, setValidating] = useState(false)
  const [ingesting, setIngesting] = useState(false)

  const fetchMetadata = async (source: AudioSource) => {
    setIngesting(true)
    try {
      const formData = new FormData()
      if (source.file) {
        formData.append("file", source.file)
      } else if (source.url) {
        formData.append("url", source.url)
        if (source.type === "youtube") {
          formData.append("sourceType", "youtube")
        } else {
          formData.append("sourceType", "url")
        }
      }

      const response = await fetch("/api/audio/extract-metadata", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const apiMetadata = await response.json()
        
        // Map API response to AudioSource metadata shape
        const fullMetadata: AudioSource["metadata"] = {
          format: apiMetadata.format || source.file?.type || "audio/mpeg",
          duration: apiMetadata.duration,
          bitrate: apiMetadata.bitrate,
          title: apiMetadata.title || "",
          artist: apiMetadata.artist || "",
          album: apiMetadata.album || "",
          genre: apiMetadata.genre || "",
          year: apiMetadata.year || new Date().getFullYear().toString(),
          coverArtUrl: apiMetadata.coverArtUrl || null,
          // Store autoFilled flags for frontend badges
          autoFilled: apiMetadata.autoFilled,
        }

        // Update source with metadata
        onChange({
          ...source,
          metadata: fullMetadata,
        })

        if (onMetadataDetected) {
          onMetadataDetected(fullMetadata)
        }

        if (onIngestionComplete) {
          onIngestionComplete(fullMetadata)
        }
      } else {
        // Fallback: use basic metadata
        const errorData = await response.json().catch(() => ({}))
        const basicMetadata: AudioSource["metadata"] = {
          format: source.file?.type || "audio/mpeg",
          duration: undefined,
          bitrate: undefined,
          title: source.file?.name?.replace(/\.[^/.]+$/, "") || "Untitled",
          artist: "Unknown Artist",
          album: "",
          genre: "",
          year: new Date().getFullYear().toString(),
          coverArtUrl: null,
        }
        
        if (onMetadataDetected) {
          onMetadataDetected(basicMetadata)
        }
        
        if (onIngestionComplete) {
          onIngestionComplete(basicMetadata)
        }
      }
    } catch (error: any) {
      console.error("[AUDIO-SOURCE] Metadata extraction error:", error)
      // Fallback on error - provide basic metadata
      const basicMetadata: AudioSource["metadata"] = {
        format: source.file?.type || "audio/mpeg",
        duration: undefined,
        bitrate: undefined,
        title: source.file?.name?.replace(/\.[^/.]+$/, "") || (source.url ? extractFilenameFromUrl(source.url) : "Untitled"),
        artist: "Unknown Artist",
        album: "",
        genre: "",
        year: new Date().getFullYear().toString(),
        coverArtUrl: null,
      }
      
      if (onMetadataDetected) {
        onMetadataDetected(basicMetadata)
      }
      
      if (onIngestionComplete) {
        onIngestionComplete(basicMetadata)
      }
    } finally {
      setIngesting(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      const file = acceptedFiles[0]
      const newSource: AudioSource = {
        type: "upload",
        file,
        url: URL.createObjectURL(file),
      }
      onChange(newSource)
      await fetchMetadata(newSource)
    },
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".flac"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    setValidating(true)
    // Validate URL
    try {
      new URL(urlInput)
      const newSource: AudioSource = {
        type: "url",
        url: urlInput,
      }
      onChange(newSource)
      await fetchMetadata(newSource)
      setValidating(false)
    } catch {
      setValidating(false)
    }
  }

  const handleYoutubeSubmit = async () => {
    if (!youtubeInput.trim()) return
    setValidating(true)
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = youtubeInput.match(youtubeRegex)
    if (match) {
      const newSource: AudioSource = {
        type: "youtube",
        url: youtubeInput,
      }
      onChange(newSource)
      await fetchMetadata(newSource)
      setValidating(false)
    } else {
      setValidating(false)
    }
  }

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>Audio Source</CardTitle>
        <CardDescription className="text-zinc-500">Choose how to ingest your audio</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as AudioSourceType)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upload">Upload MP3</TabsTrigger>
            <TabsTrigger value="youtube">YouTube Link</TabsTrigger>
            <TabsTrigger value="url">Direct URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                isDragActive
                  ? "border-violet-500/50 bg-violet-500/5"
                  : "border-zinc-800/50 hover:border-violet-500/30 hover:bg-zinc-900/30"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-3 text-zinc-400" />
              <p className="text-sm text-zinc-300 mb-1">
                {isDragActive ? "Drop audio file here" : "Drag & drop audio file"}
              </p>
              <p className="text-xs text-zinc-500">or click to browse</p>
              <p className="text-xs text-zinc-600 mt-2">MP3, WAV, M4A, FLAC (max 100MB)</p>
            </div>
            {value?.file && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                {ingesting ? (
                  <>
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    <span className="text-sm text-foreground flex-1">Ingesting audio and extracting metadata...</span>
                  </>
                ) : (
                  <>
                    <FileAudio className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-foreground flex-1">{value.file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(value.file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="youtube" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="youtube-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleYoutubeSubmit()}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={handleYoutubeSubmit}
                  disabled={!youtubeInput.trim() || validating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Paste a YouTube video URL. Audio will be extracted automatically.
              </p>
            </div>
            {value?.type === "youtube" && value.url && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                {ingesting ? (
                  <>
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    <span className="text-sm text-foreground flex-1">Extracting audio and metadata from YouTube...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-foreground flex-1">YouTube link validated</span>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audio-url">Direct Audio URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="audio-url"
                    type="url"
                    placeholder="https://example.com/audio.mp3"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || validating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Direct link to an MP3, WAV, or other audio file.
              </p>
            </div>
            {value?.type === "url" && value.url && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                {ingesting ? (
                  <>
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    <span className="text-sm text-foreground flex-1">Fetching audio and extracting metadata...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-foreground flex-1 truncate">{value.url}</span>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Metadata Display */}
        {value?.metadata && (
          <div className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                Detected
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {value.metadata.duration && (
                <div>
                  <span className="text-zinc-500">Duration:</span>{" "}
                  <span className="text-foreground">{value.metadata.duration}s</span>
                </div>
              )}
              {value.metadata.bitrate && (
                <div>
                  <span className="text-zinc-500">Bitrate:</span>{" "}
                  <span className="text-foreground">{value.metadata.bitrate} kbps</span>
                </div>
              )}
              {value.metadata.format && (
                <div>
                  <span className="text-zinc-500">Format:</span>{" "}
                  <span className="text-foreground">{value.metadata.format}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

