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
import { Upload } from "lucide-react"
import { ProcessingDialog } from "@/components/audio/ProcessingDialog"
import { Spinner } from "@/components/ui/spinner"

const uploadSchema = z.object({
  audio: z.any().refine((files) => files && files.length > 0, "Audio file is required"),
})

type UploadFormData = z.infer<typeof uploadSchema>

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [stagingData, setStagingData] = useState<{
    stagingId: string
    stagingUrl: string
    duration: number | null
    extractedCoverArt: string | null
    extractedMetadata: any
    filename: string
  } | null>(null)

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

      const response = await fetch("/api/audio/stage", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to stage audio")
      }

      const result = await response.json()
      
      // Open processing dialog with staging data
      setStagingData({
        stagingId: result.stagingId,
        stagingUrl: result.stagingUrl,
        duration: result.duration,
        extractedCoverArt: result.extractedCoverArt,
        extractedMetadata: result.extractedMetadata,
        filename: result.filename,
      })
      setProcessingOpen(true)
      reset()
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload audio")
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (formData: any) => {
    if (!stagingData) return

    try {
      const response = await fetch("/api/audio/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stagingId: stagingData.stagingId,
          stagingUrl: stagingData.stagingUrl,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process audio")
      }

      const result = await response.json()
      toast.success("Your track has been transformed.")
      setProcessingOpen(false)
      setStagingData(null)
      router.push("/dashboard/library")
    } catch (error: any) {
      console.error("Process error:", error)
      throw error
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


            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
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

      {stagingData && (
        <ProcessingDialog
          open={processingOpen}
          onOpenChange={setProcessingOpen}
          stagingId={stagingData.stagingId}
          stagingUrl={stagingData.stagingUrl}
          duration={stagingData.duration}
          extractedCoverArt={stagingData.extractedCoverArt}
          extractedMetadata={stagingData.extractedMetadata}
          filename={stagingData.filename}
          onProcess={handleProcess}
        />
      )}
    </div>
  )
}

