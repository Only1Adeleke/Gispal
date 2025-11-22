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
        <h1 className="text-3xl font-bold tracking-tight">Upload Audio</h1>
        <p className="text-muted-foreground mt-1.5">
          Upload audio files directly to your library
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Audio</CardTitle>
          <CardDescription>
            Select an audio file to upload. Maximum file size is 50MB. Supported formats: MP3, WAV, OGG, M4A, AAC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="audio" className="text-base font-medium">
                Audio File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  {...register("audio")}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
              {errors.audio && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span>
                  {errors.audio.message?.toString() || "Audio file is required"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB. Free tier: Maximum 5 minutes per file.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Title <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter audio title"
                {...register("title")}
                disabled={loading}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                If not provided, the filename will be used as the title.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-base font-medium">
                Tags <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
              </Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., music, podcast, interview"
                {...register("tags")}
                disabled={loading}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas. Tags help organize your audio library.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} size="lg">
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
                size="lg"
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

