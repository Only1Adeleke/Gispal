"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDropzone } from "react-dropzone"
import { Upload, Play, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Jingle {
  id: string
  name: string
}

interface CoverArt {
  id: string
  name: string
  isDefault: boolean
}

export default function MixPage() {
  const [audioUrl, setAudioUrl] = useState("")
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [coverArts, setCoverArts] = useState<CoverArt[]>([])
  const [selectedJingle, setSelectedJingle] = useState<string>("")
  const [selectedCoverArt, setSelectedCoverArt] = useState<string>("")
  const [position, setPosition] = useState<"start" | "middle" | "end">("start")
  const [previewOnly, setPreviewOnly] = useState(false)
  const [mixing, setMixing] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/jingles")
      .then((res) => res.json())
      .then((data) => setJingles(data))
      .catch(() => {})

    fetch("/api/cover")
      .then((res) => res.json())
      .then((data) => setCoverArts(data))
      .catch(() => {})
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    // In production, upload file first and get URL
    const fileUrl = URL.createObjectURL(file)
    setAudioUrl(fileUrl)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    maxFiles: 1,
  })

  const handleMix = async () => {
    if (!audioUrl) {
      toast({
        title: "Error",
        description: "Please provide an audio URL or upload a file",
        variant: "destructive",
      })
      return
    }

    setMixing(true)
    setOutputUrl(null)

    try {
      const response = await fetch("/api/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl,
          jingleId: selectedJingle || undefined,
          coverArtId: selectedCoverArt || undefined,
          position,
          previewOnly,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOutputUrl(data.outputUrl)
        toast({
          title: "Success",
          description: "Audio mixed successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to mix audio",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mix Audio</h1>
        <p className="text-gray-600 mt-2">Mix your audio with jingles and cover art</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your mix settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Audio URL or Upload</Label>
              <Input
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                  isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive ? "Drop file here" : "Or drag & drop audio file"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jingle (Optional)</Label>
              <Select value={selectedJingle} onValueChange={setSelectedJingle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a jingle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jingles.map((jingle) => (
                    <SelectItem key={jingle.id} value={jingle.id}>
                      {jingle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cover Art (Optional)</Label>
              <Select value={selectedCoverArt} onValueChange={setSelectedCoverArt}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cover art" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {coverArts.map((art) => (
                    <SelectItem key={art.id} value={art.id}>
                      {art.name} {art.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jingle Position</Label>
              <Select value={position} onValueChange={(v: any) => setPosition(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="preview"
                checked={previewOnly}
                onChange={(e) => setPreviewOnly(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="preview">Preview only (20-30 seconds)</Label>
            </div>

            <Button
              onClick={handleMix}
              disabled={mixing || !audioUrl}
              className="w-full"
            >
              {mixing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mixing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Mix Audio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Your mixed audio</CardDescription>
          </CardHeader>
          <CardContent>
            {outputUrl ? (
              <div className="space-y-4">
                <audio controls src={outputUrl} className="w-full" />
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={outputUrl} download>
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Mixed audio will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

