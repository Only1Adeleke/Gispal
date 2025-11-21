"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"
import { Upload, Trash2, Star, Lock, Image as ImageIcon, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface CoverArt {
  id: string
  name: string
  fileUrl: string
  fileSize: number
  isDefault: boolean
  createdAt: string
}

export default function CoverArtPage() {
  const [coverArts, setCoverArts] = useState<CoverArt[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [userPlan, setUserPlan] = useState<{ plan: string; coverArtCount: number; maxCoverArts: number } | null>(null)
  const [extractedCoverArt, setExtractedCoverArt] = useState<string | null>(null)

  const fetchCoverArts = async () => {
    try {
      const response = await fetch("/api/cover")
      if (response.ok) {
        const data = await response.json()
        setCoverArts(data)
      }
    } catch (error) {
      toast.error("Failed to fetch cover arts")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPlan = async () => {
    try {
      const response = await fetch("/api/user/plan")
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data)
      }
    } catch (error) {
      setUserPlan({ plan: "free", coverArtCount: coverArts.length, maxCoverArts: 1 })
    }
  }

  useEffect(() => {
    fetchCoverArts()
    fetchUserPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    if (userPlan && coverArts.length >= userPlan.maxCoverArts) {
      toast.error(`Maximum ${userPlan.maxCoverArts} cover art(s) allowed for your plan`)
      setUploadOpen(false)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)
      formData.append("isDefault", "false")

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/cover/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        toast.success("Cover art uploaded successfully")
        setUploadOpen(false)
        setUploadProgress(0)
        fetchCoverArts()
        fetchUserPlan()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to upload cover art")
      }
    } catch (error) {
      toast.error("Failed to upload cover art")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
    disabled: uploading || (userPlan ? coverArts.length >= userPlan.maxCoverArts : false),
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cover art?")) return

    try {
      const response = await fetch(`/api/cover/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Cover art deleted successfully")
        fetchCoverArts()
        fetchUserPlan()
      } else {
        toast.error("Failed to delete cover art")
      }
    } catch (error) {
      toast.error("Failed to delete cover art")
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/cover/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })

      if (response.ok) {
        toast.success("Default cover art updated")
        fetchCoverArts()
      } else {
        toast.error("Failed to set default cover art")
      }
    } catch (error) {
      toast.error("Failed to set default cover art")
    }
  }

  const handleWordPressUpload = async () => {
    toast.info("WordPress Media upload - to be implemented with plugin integration")
  }

  const isLimitReached = userPlan ? coverArts.length >= userPlan.maxCoverArts : false
  const isPro = userPlan?.plan !== "free"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cover Art</h1>
          <p className="text-gray-600 mt-2">Manage your cover art images</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLimitReached && !isPro}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Cover Art
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Cover Art</DialogTitle>
              <DialogDescription>
                Upload an image to use as cover art
                {!isPro && (
                  <span className="block mt-2 text-xs text-amber-600">
                    Free plan: Maximum 1 cover art allowed
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {isLimitReached && !isPro ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Limit Reached</p>
                    <p className="text-sm">
                      You&apos;ve reached the maximum number of cover arts for your plan. 
                      Upgrade to Pro for unlimited cover arts.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
                  } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p>Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="mb-2">Drag & drop an image here, or click to select</p>
                      <p className="text-sm text-gray-500">JPG, PNG</p>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="custom" className="space-y-4">
        <TabsList>
          <TabsTrigger value="custom">My Cover Arts</TabsTrigger>
          <TabsTrigger value="extracted" disabled={!isPro}>
            Extracted {!isPro && <Lock className="w-3 h-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="wordpress" disabled={!isPro}>
            WordPress Media {!isPro && <Lock className="w-3 h-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Custom Cover Arts
              </CardTitle>
              <CardDescription>
                {coverArts.length} / {userPlan?.maxCoverArts === Infinity ? "∞" : userPlan?.maxCoverArts || 1} cover arts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : coverArts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No cover arts uploaded yet.</p>
                  <p className="text-sm mt-2">Click &quot;Upload Cover Art&quot; to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coverArts.map((art) => (
                    <Card key={art.id}>
                      <CardContent className="p-4">
                        <div className="relative aspect-square mb-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={art.fileUrl}
                            alt={art.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {art.isDefault && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded">
                              <Star className="w-4 h-4 fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{art.name}</p>
                            {art.isDefault && (
                              <p className="text-sm text-gray-500">Default</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!art.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(art.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(art.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extracted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Cover Art</CardTitle>
              <CardDescription>
                Cover art extracted from YouTube/Audiomack URLs (Pro only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractedCoverArt ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={extractedCoverArt}
                    alt="Extracted cover art"
                    className="w-full max-w-md rounded-lg"
                  />
                  <Button>Use This Cover Art</Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No extracted cover art available.</p>
                  <p className="text-sm mt-2">
                    Extract cover art by converting a YouTube or Audiomack URL in the Mixer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wordpress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WordPress Media</CardTitle>
              <CardDescription>
                Upload cover art from WordPress Media Library (Pro only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button onClick={handleWordPressUpload}>
                  Upload from WordPress
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  This feature requires the WordPress plugin to be installed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

