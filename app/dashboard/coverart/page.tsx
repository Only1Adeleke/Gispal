"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useDropzone } from "react-dropzone"
import { Upload, Trash2, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// Using img tag instead of Next Image for external URLs

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
  const { toast } = useToast()

  const fetchCoverArts = async () => {
    try {
      const response = await fetch("/api/cover")
      if (response.ok) {
        const data = await response.json()
        setCoverArts(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cover arts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoverArts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)
      formData.append("isDefault", "false")

      const response = await fetch("/api/cover/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cover art uploaded successfully",
        })
        setUploadOpen(false)
        fetchCoverArts()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to upload cover art",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload cover art",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cover art?")) return

    try {
      const response = await fetch(`/api/cover/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cover art deleted successfully",
        })
        fetchCoverArts()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete cover art",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cover art",
        variant: "destructive",
      })
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
        toast({
          title: "Success",
          description: "Default cover art updated",
        })
        fetchCoverArts()
      } else {
        toast({
          title: "Error",
          description: "Failed to set default cover art",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default cover art",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cover Art</h1>
          <p className="text-gray-600 mt-2">Manage your cover art images</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Cover Art
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Cover Art</DialogTitle>
              <DialogDescription>Upload an image to use as cover art</DialogDescription>
            </DialogHeader>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
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
              <div className="text-center text-sm text-gray-600">Uploading...</div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : coverArts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No cover arts uploaded yet. Click &quot;Upload Cover Art&quot; to get started.
          </CardContent>
        </Card>
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
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

