"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { GenreSelect } from "./genre-select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface AudioMetadata {
  title: string
  artist: string
  album: string
  genre: string
  year: string
  isrc?: string
  description?: string
  coverArt?: {
    type: "auto" | "upload" | "default"
    file?: File
    url?: string
  }
}

interface MetadataEditorProps {
  value: AudioMetadata
  onChange: (metadata: AudioMetadata) => void
  autoFilled?: Partial<Record<keyof AudioMetadata, boolean>>
  loading?: boolean
  defaultCoverArtUrl?: string
}

export function MetadataEditor({
  value,
  onChange,
  autoFilled = {},
  loading = false,
  defaultCoverArtUrl,
}: MetadataEditorProps) {
  const [coverArtLoading, setCoverArtLoading] = useState(false)

  // Set default cover art on mount if available
  useEffect(() => {
    if (defaultCoverArtUrl && !value.coverArt?.url && value.coverArt?.type !== "upload") {
      onChange({
        ...value,
        coverArt: {
          type: "default",
          url: defaultCoverArtUrl,
        },
      })
    }
  }, [defaultCoverArtUrl])

  const handleCoverArtUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onChange({
          ...value,
          coverArt: {
            type: "upload",
            file,
            url: URL.createObjectURL(file),
          },
        })
      }
    }
    input.click()
  }

  // Default year to current year if empty
  const currentYear = new Date().getFullYear().toString()
  const displayYear = value.year || currentYear

  if (loading) {
    return (
      <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader>
        <CardTitle>Metadata Editor</CardTitle>
        <CardDescription className="text-zinc-500">Edit track information and cover art</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="title">Title *</Label>
              {autoFilled.title && (
                <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Auto-filled
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">The track title. This is required and will appear in all metadata.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="title"
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Track title"
              className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="artist">Artist *</Label>
              {autoFilled.artist && (
                <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Auto-filled
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">The artist or performer name. This is required for proper attribution.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="artist"
              value={value.artist}
              onChange={(e) => onChange({ ...value, artist: e.target.value })}
              placeholder="Artist name"
              className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="album">Album</Label>
              {autoFilled.album && (
                <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Auto-filled
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">The album or collection name. Optional but recommended for organization.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="album"
              value={value.album}
              onChange={(e) => onChange({ ...value, album: e.target.value })}
              placeholder="Album name"
              className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50"
            />
          </div>

          <GenreSelect
            value={value.genre}
            onChange={(genre) => onChange({ ...value, genre })}
            autoFilled={autoFilled.genre}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="year">Year</Label>
              {autoFilled.year && (
                <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Auto-filled
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">The release year. Defaults to current year but can be edited.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="year"
              type="number"
              value={displayYear}
              onChange={(e) => onChange({ ...value, year: e.target.value })}
              placeholder={currentYear}
              min="1900"
              max={currentYear}
              className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="isrc">ISRC (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      International Standard Recording Code. Used for tracking and royalty purposes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="isrc"
              value={value.isrc || ""}
              onChange={(e) => onChange({ ...value, isrc: e.target.value })}
              placeholder="USRC17607839"
              className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="description">Description</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Additional notes or description about the track. Optional.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="description"
            value={value.description || ""}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Track description or notes"
            rows={3}
            className="bg-zinc-900/50 border-zinc-800/50 resize-none focus:border-violet-500/50"
          />
        </div>

        {/* Cover Art */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Cover Art</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Album artwork. Defaults to your last uploaded cover art, or can be auto-detected from source.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            {value.coverArt?.url ? (
              <div className="relative group">
                <img
                  src={value.coverArt.url}
                  alt="Cover art"
                  className="w-24 h-24 rounded-lg object-cover border border-zinc-800/50 group-hover:border-violet-500/50 transition-colors"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-red-500/90 hover:bg-red-500 text-white"
                  onClick={() =>
                    onChange({
                      ...value,
                      coverArt: defaultCoverArtUrl
                        ? {
                            type: "default",
                            url: defaultCoverArtUrl,
                          }
                        : undefined,
                    })
                  }
                >
                  ×
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-800/50 flex items-center justify-center bg-zinc-900/30">
                {coverArtLoading ? (
                  <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-600" />
                )}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCoverArtUpload}
                  className="border-zinc-800/50 hover:bg-zinc-900/50 hover:border-violet-500/50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Cover Art
                </Button>
                <Badge variant="outline" className="text-xs">
                  {value.coverArt?.type === "auto"
                    ? "Auto-detected"
                    : value.coverArt?.type === "default"
                      ? "Default"
                      : value.coverArt?.type === "upload"
                        ? "Custom"
                        : "None"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">
                {value.coverArt?.type === "auto"
                  ? "Cover art auto-detected from source"
                  : value.coverArt?.type === "default"
                    ? "Using your default cover art"
                    : "Upload a square image (recommended: 1000x1000px)"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
