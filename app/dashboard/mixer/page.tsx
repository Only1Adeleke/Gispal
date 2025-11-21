"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useDropzone } from "react-dropzone"
import { Upload, Play, Loader2, Download, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Jingle {
  id: string
  name: string
}

interface CoverArt {
  id: string
  name: string
  isDefault: boolean
}

export default function MixerPage() {
  const [audioUrl, setAudioUrl] = useState("")
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [coverArts, setCoverArts] = useState<CoverArt[]>([])
  const [selectedJingles, setSelectedJingles] = useState<Array<{ jingleId: string; position: "start" | "middle" | "end"; volume: number }>>([])
  const [selectedCoverArt, setSelectedCoverArt] = useState<string>("")
  const [coverArtSource, setCoverArtSource] = useState<"custom" | "extracted" | "wp_media">("custom")
  const [mixing, setMixing] = useState(false)
  const [mixingProgress, setMixingProgress] = useState(0)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(true)
  const [userPlan, setUserPlan] = useState<{ plan: string } | null>(null)
  const [extractedData, setExtractedData] = useState<{ audioUrl?: string; coverArtUrl?: string } | null>(null)

  const isPro = userPlan?.plan !== "free"

  useEffect(() => {
    fetch("/api/jingles")
      .then((res) => res.json())
      .then((data) => setJingles(data))
      .catch(() => {})

    fetch("/api/cover")
      .then((res) => res.json())
      .then((data) => setCoverArts(data))
      .catch(() => {})

    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        setUserPlan(data)
        setIsPreview(data.plan === "free")
      })
      .catch(() => {})
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]
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

  const handleExtract = async () => {
    if (!audioUrl) {
      toast.error("Please enter a YouTube or Audiomack URL")
      return
    }

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: audioUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        setExtractedData(data)
        setAudioUrl(data.audioUrl)
        if (data.coverArtUrl && isPro) {
          setCoverArtSource("extracted")
        }
        toast.success("Audio extracted successfully")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to extract audio")
      }
    } catch (error) {
      toast.error("Failed to extract audio")
    }
  }

  const handleAddJingle = () => {
    if (jingles.length === 0) {
      toast.error("No jingles available. Please upload a jingle first.")
      return
    }

    if (!isPro && selectedJingles.length >= 1) {
      toast.error("Free plan: Maximum 1 jingle allowed")
      return
    }

    if (isPro && selectedJingles.length >= 3) {
      toast.error("Maximum 3 jingles allowed")
      return
    }

    setSelectedJingles([
      ...selectedJingles,
      { jingleId: jingles[0].id, position: "start", volume: 1.0 },
    ])
  }

  const handleRemoveJingle = (index: number) => {
    setSelectedJingles(selectedJingles.filter((_, i) => i !== index))
  }

  const handleUpdateJingle = (index: number, updates: Partial<typeof selectedJingles[0]>) => {
    const updated = [...selectedJingles]
    updated[index] = { ...updated[index], ...updates }
    setSelectedJingles(updated)
  }

  const handleMix = async () => {
    if (!audioUrl) {
      toast.error("Please provide an audio URL or upload a file")
      return
    }

    setMixing(true)
    setMixingProgress(0)
    setOutputUrl(null)

    try {
      const progressInterval = setInterval(() => {
        setMixingProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const response = await fetch("/api/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: audioUrl.startsWith("blob:") ? extractedData?.audioUrl || audioUrl : audioUrl,
          audioSource: audioUrl,
          jingles: selectedJingles.map((j) => ({
            jingleId: j.jingleId,
            position: j.position,
            volume: j.volume,
          })),
          coverArtId: selectedCoverArt || undefined,
          coverArtSource: coverArtSource,
          extractedCoverArtUrl: extractedData?.coverArtUrl,
          previewOnly: isPreview,
        }),
      })

      clearInterval(progressInterval)
      setMixingProgress(100)

      if (response.ok) {
        const data = await response.json()
        setOutputUrl(data.outputUrl)
        toast.success(isPreview ? "Preview generated successfully!" : "Audio mixed successfully!")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to mix audio")
      }
    } catch (error) {
      toast.error("Failed to mix audio")
    } finally {
      setMixing(false)
      setMixingProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mixer</h1>
        <p className="text-gray-600 mt-2">Mix your audio with jingles and cover art</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your mix settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label>Audio URL (YouTube, Audiomack, or MP3)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=... or https://example.com/audio.mp3"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                    />
                    <Button onClick={handleExtract} variant="outline">
                      Extract
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragActive ? "Drop file here" : "Or drag & drop audio file"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Jingles</Label>
                {!isPro && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Max 1 (Free)
                  </Badge>
                )}
                {isPro && (
                  <Badge variant="secondary" className="text-xs">
                    Max 3 (Pro)
                  </Badge>
                )}
              </div>
              {selectedJingles.map((jingle, index) => (
                <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={jingle.jingleId}
                      onValueChange={(value) => handleUpdateJingle(index, { jingleId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jingles.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={jingle.position}
                        onValueChange={(value: "start" | "middle" | "end") =>
                          handleUpdateJingle(index, { position: value })
                        }
                        disabled={!isPro && jingle.position !== "start"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="middle" disabled={!isPro}>
                            Middle {!isPro && <Lock className="w-3 h-3 inline ml-1" />}
                          </SelectItem>
                          <SelectItem value="end" disabled={!isPro}>
                            End {!isPro && <Lock className="w-3 h-3 inline ml-1" />}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isPro ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Volume</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={jingle.volume}
                            onChange={(e) =>
                              handleUpdateJingle(index, { volume: parseFloat(e.target.value) })
                            }
                            className="h-9"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 mr-1" />
                          Volume locked
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveJingle(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {selectedJingles.length < (isPro ? 3 : 1) && (
                <Button variant="outline" onClick={handleAddJingle} className="w-full">
                  Add Jingle
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cover Art Source</Label>
              <Select value={coverArtSource} onValueChange={(v: any) => setCoverArtSource(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">My Custom Cover Arts</SelectItem>
                  <SelectItem value="extracted" disabled={!isPro || !extractedData?.coverArtUrl}>
                    Extracted from URL {!isPro && <Lock className="w-3 h-3 inline ml-1" />}
                  </SelectItem>
                  <SelectItem value="wp_media" disabled={!isPro}>
                    WordPress Media {!isPro && <Lock className="w-3 h-3 inline ml-1" />}
                  </SelectItem>
                </SelectContent>
              </Select>
              {coverArtSource === "custom" && (
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
              )}
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
              ) : isPreview ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Preview (30s)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Export Full Mix
                </>
              )}
            </Button>
            {mixing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{mixingProgress}%</span>
                </div>
                <Progress value={mixingProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              {isPreview ? "Preview (30 seconds)" : "Full Export"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outputUrl ? (
              <div className="space-y-4">
                <audio controls src={outputUrl} className="w-full" />
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={outputUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  {isPreview && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Preview expires in 10 minutes</span>
                    </div>
                  )}
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

