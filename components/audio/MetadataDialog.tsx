"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, User, Mic, Calendar, Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"

const metadataSchema = z.object({
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  producer: z.string().optional(),
  year: z.string().optional(),
  tags: z.string().optional(),
})

type MetadataFormValues = z.infer<typeof metadataSchema>

interface Audio {
  id: string
  title: string
  tags?: string | null
  artist?: string
  album?: string
  producer?: string
  year?: string
}

interface MetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  audio: Audio | null
  onUpdate?: () => void
}

export function MetadataDialog({
  open,
  onOpenChange,
  audio,
  onUpdate,
}: MetadataDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      artist: "",
      album: "",
      producer: "",
      year: "",
      tags: "",
    },
  })

  useEffect(() => {
    if (audio && open) {
      form.reset({
        title: audio.title || "",
        artist: audio.artist || "",
        album: audio.album || "",
        producer: audio.producer || "",
        year: audio.year || "",
        tags: audio.tags || "",
      })
    }
  }, [audio, open, form])

  const onSubmit = async (values: MetadataFormValues) => {
    if (!audio) return

    setLoading(true)
    try {
      const response = await fetch(`/api/audio/${audio.id}/metadata`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update metadata")
      }

      toast.success("Metadata updated successfully")
      onUpdate?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating metadata:", error)
      toast.error(error.message || "Failed to update metadata")
    } finally {
      setLoading(false)
    }
  }

  if (!audio) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle>Edit Metadata</DialogTitle>
          <DialogDescription>
            Update the metadata for this audio file
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter audio title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Artist
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter artist name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="tags" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., music, podcast, interview"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Separate multiple tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="album"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Album</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter album name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="producer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Producer
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter producer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Year
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter year"
                          type="number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

