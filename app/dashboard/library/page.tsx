"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Play, Pause, Download, Copy, Trash2, Loader2, Music, Sliders } from "lucide-react"
import { format } from "date-fns"

interface Audio {
  id: string
  title: string
  tags: string | null
  url: string
  duration: number | null
  createdAt: string
}

export default function LibraryPage() {
  const router = useRouter()
  const [audios, setAudios] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())

  useEffect(() => {
    fetchAudios()
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

  const handlePlay = (audio: Audio) => {
    // Stop any currently playing audio
    if (playingId) {
      const currentAudio = audioElements.get(playingId)
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    // Play the selected audio
    let audioElement = audioElements.get(audio.id)
    if (!audioElement) {
      audioElement = new Audio(audio.url)
      audioElement.addEventListener("ended", () => {
        setPlayingId(null)
      })
      setAudioElements((prev) => new Map(prev).set(audio.id, audioElement!))
    }

    if (playingId === audio.id) {
      // Pause if already playing
      audioElement.pause()
      setPlayingId(null)
    } else {
      // Play new audio
      audioElement.play()
      setPlayingId(audio.id)
    }
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

      // Stop playing if this audio is currently playing
      if (playingId === audioId) {
        const audioElement = audioElements.get(audioId)
        if (audioElement) {
          audioElement.pause()
          setPlayingId(null)
        }
      }

      // Remove from state
      setAudios(audios.filter((a) => a.id !== audioId))
      audioElements.delete(audioId)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audio Library</h1>
          <p className="text-muted-foreground">
            Manage your uploaded audio files
          </p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard/upload"}>
          <Music className="mr-2 h-4 w-4" />
          Upload Audio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Audio Files</CardTitle>
          <CardDescription>
            View, play, download, and manage your audio files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : audios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audio files yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = "/dashboard/upload"}
              >
                Upload Your First Audio
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audios.map((audio) => (
                  <TableRow key={audio.id}>
                    <TableCell className="font-medium">{audio.title}</TableCell>
                    <TableCell>
                      {audio.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {audio.tags.split(",").map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-secondary rounded"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(audio.duration)}</TableCell>
                    <TableCell>
                      {format(new Date(audio.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlay(audio)}
                          title={playingId === audio.id ? "Pause" : "Play"}
                        >
                          {playingId === audio.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/mix/${audio.id}`)}
                          title="Mix Audio"
                        >
                          <Sliders className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(audio)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyEmbed(audio)}
                          title="Copy Embed Code"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(audio.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

