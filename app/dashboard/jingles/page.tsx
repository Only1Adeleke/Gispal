"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"
import { Upload, Trash2, Music, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [userPlan, setUserPlan] = useState<{ plan: string; jingleCount: number; maxJingles: number } | null>(null)

  const fetchJingles = async () => {
    try {
      const response = await fetch("/api/jingles")
      if (response.ok) {
        const data = await response.json()
        setJingles(data)
      } else {
        toast.error("Failed to fetch jingles")
      }
    } catch (error) {
      toast.error("Failed to fetch jingles")
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
      // Fallback - assume free plan
      setUserPlan({ plan: "free", jingleCount: jingles.length, maxJingles: 1 })
    }
  }

  useEffect(() => {
    fetchJingles()
    fetchUserPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Check limit
    if (userPlan && jingles.length >= userPlan.maxJingles) {
      toast.error(`Maximum ${userPlan.maxJingles} jingle(s) allowed for your plan`)
      setUploadOpen(false)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/jingles/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        toast.success("Jingle uploaded successfully")
        setUploadOpen(false)
        setUploadProgress(0)
        fetchJingles()
        fetchUserPlan()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to upload jingle")
      }
    } catch (error) {
      toast.error("Failed to upload jingle")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    maxFiles: 1,
    disabled: uploading || (userPlan ? jingles.length >= userPlan.maxJingles : false),
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this jingle?")) return

    try {
      const response = await fetch(`/api/jingles/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Jingle deleted successfully")
        fetchJingles()
        fetchUserPlan()
      } else {
        toast.error("Failed to delete jingle")
      }
    } catch (error) {
      toast.error("Failed to delete jingle")
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

  const isLimitReached = userPlan ? jingles.length >= userPlan.maxJingles : false
  const isPro = userPlan?.plan !== "free"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jingles</h1>
          <p className="text-muted-foreground mt-1.5">Manage your audio jingles</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLimitReached}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Jingle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Jingle</DialogTitle>
              <DialogDescription>
                Upload an audio file to use as a jingle
                {!isPro && (
                  <span className="block mt-2 text-xs text-amber-600">
                    Free plan: Maximum 1 jingle allowed
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {isLimitReached ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Limit Reached</p>
                    <p className="text-sm">
                      You&apos;ve reached the maximum number of jingles for your plan. 
                      {!isPro && " Upgrade to Pro for unlimited jingles."}
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
                      <p className="mb-2">Drag & drop an audio file here, or click to select</p>
                      <p className="text-sm text-muted-foreground">MP3, WAV, M4A</p>
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

      {userPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Your Jingles
            </CardTitle>
            <CardDescription>
              {jingles.length} / {userPlan.maxJingles === Infinity ? "∞" : userPlan.maxJingles} jingles
              {!isPro && " (Free plan limit: 1 jingle)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : jingles.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No jingles uploaded yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click &quot;Upload Jingle&quot; to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(jingle.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
