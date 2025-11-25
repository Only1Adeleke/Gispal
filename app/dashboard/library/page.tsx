"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Download, Copy, Trash2, Loader2, Music, Sliders, Upload as UploadIcon, Eye, Edit, RefreshCw, Sparkles, Play } from "lucide-react"
import { format } from "date-fns"
import { MetadataDialog } from "@/components/audio/MetadataDialog"
import { ProcessingDialog } from "@/components/audio/ProcessingDialog"

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

export default function LibraryPage() {
  const router = useRouter()
  const [audios, setAudios] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [previewAudio, setPreviewAudio] = useState<Audio | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [metadataAudio, setMetadataAudio] = useState<Audio | null>(null)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [regenerateAudio, setRegenerateAudio] = useState<Audio | null>(null)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerateStaging, setRegenerateStaging] = useState<{
    stagingId: string
    stagingUrl: string
    duration: number | null
    extractedCoverArt: string | null
    extractedMetadata: any
    filename: string
  } | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  useEffect(() => {
    fetchAudios()
    // Refresh when page becomes visible (e.g., when navigating back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAudios()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const fetchAudios = async () => {
    try {
      const response = await fetch("/api/audio")
      if (!response.ok) {
        throw new Error("Failed to fetch audio files")
      }
      const data = await response.json()
      setAudios(data)
    } catch (error: any) {
      console.error("Error fetching audios:", error)
      toast.error(error.message || "Failed to load audio library")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (audio: Audio) => {
    setPreviewAudio(audio)
    setPreviewOpen(true)
  }

  const handlePlay = (audio: Audio) => {
    // Open preview dialog to play the audio
    setPlayingAudio(audio.id)
    handlePreview(audio)
  }

  const handleDownload = (audio: Audio) => {
    const link = document.createElement("a")
    link.href = audio.url
    link.download = `${audio.title}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Download started")
  }

  const handleCopyEmbed = (audio: Audio) => {
    const embedCode = `<audio src="${audio.url}" controls></audio>`
    navigator.clipboard.writeText(embedCode)
    toast.success("Embed code copied to clipboard")
  }

  const handleDelete = async (audioId: string) => {
    if (!confirm("Are you sure you want to delete this audio file?")) {
      return
    }

    try {
      const response = await fetch(`/api/audio/${audioId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete audio")
      }

      // Close preview if this audio is being previewed
      if (previewAudio?.id === audioId) {
        setPreviewOpen(false)
        setPreviewAudio(null)
      }

      // Remove from state
      setAudios(audios.filter((a) => a.id !== audioId))
      toast.success("Audio deleted successfully")
    } catch (error: any) {
      console.error("Error deleting audio:", error)
      toast.error(error.message || "Failed to delete audio")
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRegenerate = async (audio: Audio) => {
    try {
      // Download the audio file to staging
      const response = await fetch(audio.url.startsWith("http") ? audio.url : `http://localhost:3000${audio.url}`)
      if (!response.ok) {
        throw new Error("Failed to fetch audio file")
      }

      const blob = await response.blob()
      const formData = new FormData()
      formData.append("audio", blob, `${audio.title}.mp3`)

      const stageResponse = await fetch("/api/audio/stage", {
        method: "POST",
        body: formData,
      })

      if (!stageResponse.ok) {
        const error = await stageResponse.json()
        throw new Error(error.error || "Failed to stage audio")
      }

      const stageResult = await stageResponse.json()
      
      setRegenerateAudio(audio)
      setRegenerateStaging({
        stagingId: stageResult.stagingId,
        stagingUrl: stageResult.stagingUrl,
        duration: stageResult.duration || audio.duration,
        extractedCoverArt: stageResult.extractedCoverArt,
        extractedMetadata: {
          title: audio.title,
          artist: audio.artist,
          album: audio.album,
        },
        filename: `${audio.title}.mp3`,
      })
      setRegenerateOpen(true)
    } catch (error: any) {
      console.error("Regenerate error:", error)
      toast.error(error.message || "Failed to regenerate audio")
    }
  }

  const handleRegenerateProcess = async (formData: any) => {
    if (!regenerateStaging) return

    try {
      const response = await fetch("/api/audio/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stagingId: regenerateStaging.stagingId,
          stagingUrl: regenerateStaging.stagingUrl,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process audio")
      }

      const result = await response.json()
      toast.success("Your track has been transformed.")
      setRegenerateOpen(false)
      setRegenerateAudio(null)
      setRegenerateStaging(null)
      fetchAudios()
    } catch (error: any) {
      console.error("Process error:", error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audio Library</h1>
          <p className="text-muted-foreground mt-1.5">
            Manage your uploaded audio files
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/upload-external")}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            External
          </Button>
          <Button onClick={() => router.push("/dashboard/upload")}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Audio
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Audio Files</CardTitle>
              <CardDescription>
                View, play, download, and manage your audio files
              </CardDescription>
            </div>
            {!loading && audios.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {audios.length} {audios.length === 1 ? "file" : "files"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : audios.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No audio files yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by uploading your first audio file
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/upload-external")}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Import from URL
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/upload")}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[120px]">Uploaded</TableHead>
                    <TableHead className="text-right w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audios.map((audio) => (
                    <TableRow key={audio.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[280px]" title={audio.title}>
                            {audio.title}
                          </span>
                          {audio.tags && audio.tags.toLowerCase().includes("mixed") && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-primary/80">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Mixed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {audio.tags ? (
                          <div className="flex flex-wrap gap-1">
                            {audio.tags.split(",").slice(0, 3).map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag.trim()}
                              </Badge>
                            ))}
                            {audio.tags.split(",").length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{audio.tags.split(",").length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatDuration(audio.duration)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(audio.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePlay(audio)}
                            title="Play Audio"
                            className="h-8 w-8 hover:scale-110 transition-transform text-primary hover:text-primary"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(audio)}
                            title="Preview Audio"
                            className="h-8 w-8 hover:scale-110 transition-transform"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRegenerate(audio)}
                            title="Regenerate"
                            className="h-8 w-8 hover:scale-110 transition-transform"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/mix/${audio.id}`)}
                            title="Mix Audio"
                            className="h-8 w-8 hover:scale-110 transition-transform"
                          >
                            <Sliders className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(audio)}
                            title="Download"
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setMetadataAudio(audio)
                              setMetadataOpen(true)
                            }}
                            title="Edit Metadata"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyEmbed(audio)}
                            title="Copy Embed Code"
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(audio.id)}
                            title="Delete"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        audio={metadataAudio}
        onUpdate={fetchAudios}
      />

      {regenerateStaging && (
        <ProcessingDialog
          open={regenerateOpen}
          onOpenChange={setRegenerateOpen}
          stagingId={regenerateStaging.stagingId}
          stagingUrl={regenerateStaging.stagingUrl}
          duration={regenerateStaging.duration}
          extractedCoverArt={regenerateStaging.extractedCoverArt}
          extractedMetadata={regenerateStaging.extractedMetadata}
          filename={regenerateStaging.filename}
          onProcess={handleRegenerateProcess}
        />
      )}
    </div>
  )
}

