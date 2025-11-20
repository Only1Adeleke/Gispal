"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDropzone } from "react-dropzone"
import { Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Jingle {
  id: string
  name: string
  fileUrl: string
  fileSize: number
  duration?: number
  createdAt: string
}

export default function JinglesPage() {
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const fetchJingles = async () => {
    try {
      const response = await fetch("/api/jingles")
      if (response.ok) {
        const data = await response.json()
        setJingles(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jingles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJingles()
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)

      const response = await fetch("/api/jingles/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Jingle uploaded successfully",
        })
        setUploadOpen(false)
        fetchJingles()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to upload jingle",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload jingle",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    maxFiles: 1,
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this jingle?")) return

    try {
      const response = await fetch(`/api/jingles/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Jingle deleted successfully",
        })
        fetchJingles()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete jingle",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete jingle",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jingles</h1>
          <p className="text-gray-600 mt-2">Manage your audio jingles</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Jingle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Jingle</DialogTitle>
              <DialogDescription>Upload an audio file to use as a jingle</DialogDescription>
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
                  <p className="mb-2">Drag & drop an audio file here, or click to select</p>
                  <p className="text-sm text-gray-500">MP3, WAV, M4A</p>
                </div>
              )}
            </div>
            {uploading && (
              <div className="text-center text-sm text-gray-600">Uploading...</div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Jingles</CardTitle>
          <CardDescription>All uploaded jingles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : jingles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jingles uploaded yet. Click "Upload Jingle" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jingles.map((jingle) => (
                  <TableRow key={jingle.id}>
                    <TableCell className="font-medium">{jingle.name}</TableCell>
                    <TableCell>{formatDuration(jingle.duration)}</TableCell>
                    <TableCell>{formatFileSize(jingle.fileSize)}</TableCell>
                    <TableCell>
                      {new Date(jingle.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(jingle.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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

