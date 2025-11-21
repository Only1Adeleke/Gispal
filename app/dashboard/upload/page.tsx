"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"

const uploadSchema = z.object({
  title: z.string().optional(),
  tags: z.string().optional(),
  audio: z.any().refine((files) => files && files.length > 0, "Audio file is required"),
})

type UploadFormData = z.infer<typeof uploadSchema>

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const onSubmit = async (data: UploadFormData) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("audio", data.audio[0])
      if (data.title) {
        formData.append("title", data.title)
      }
      if (data.tags) {
        formData.append("tags", data.tags)
      }

      const response = await fetch("/api/audio/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload audio")
      }

      const result = await response.json()
      toast.success("Audio uploaded successfully!")
      reset()
      router.push("/dashboard/library")
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload audio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Audio</h1>
        <p className="text-muted-foreground">
          Upload audio files to your library
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Audio</CardTitle>
          <CardDescription>
            Select an audio file to upload. Maximum file size is 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="audio">Audio File *</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                {...register("audio")}
                disabled={loading}
              />
              {errors.audio && (
                <p className="text-sm text-red-600">
                  {errors.audio.message?.toString() || "Audio file is required"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter audio title"
                {...register("title")}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                If not provided, the filename will be used as the title.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., music, podcast, interview"
                {...register("tags")}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple tags with commas.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/library")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

