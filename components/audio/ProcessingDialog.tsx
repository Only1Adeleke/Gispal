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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FileText, User, Mic, Calendar, Tag, Music, Image, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamic import for audio player
const AudioPlayer = dynamic(() => import("@/components/audio/Player").then(mod => ({ default: mod.AudioPlayer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

const processingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  album: z.string().optional(),
  producer: z.string().optional(),
  year: z.string().optional(),
  tags: z.string().optional(),
  jingleId: z.string().optional(),
  position: z.enum(["start", "middle", "end", "start-end"]).optional(),
  volume: z.number().min(0).max(100).optional(),
  coverArtSource: z.enum(["original", "default", "custom"]).optional(),
  coverArtFile: z.any().optional(),
})

type ProcessingFormValues = z.infer<typeof processingSchema>

interface Jingle {
  id: string
  name: string
  fileUrl: string
  duration?: number
}

interface ProcessingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stagingId: string
  stagingUrl: string
  duration: number | null
  extractedCoverArt: string | null
  extractedMetadata: {
    title?: string
    artist?: string
    album?: string
  }
  filename: string
  onProcess: (data: ProcessingFormValues) => Promise<void>
}

export function ProcessingDialog({
  open,
  onOpenChange,
  stagingId,
  stagingUrl,
  duration,
  extractedCoverArt,
  extractedMetadata,
  filename,
  onProcess,
}: ProcessingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [defaultCoverArt, setDefaultCoverArt] = useState<string | null>(null)
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(extractedCoverArt)
  const [coverArtSource, setCoverArtSource] = useState<"original" | "default" | "custom">(
    extractedCoverArt ? "original" : "default"
  )

  const form = useForm<ProcessingFormValues>({
    resolver: zodResolver(processingSchema),
    defaultValues: {
      title: extractedMetadata.title || filename.replace(/\.[^/.]+$/, ""),
      artist: extractedMetadata.artist || "",
      album: extractedMetadata.album || "",
      producer: "",
      year: "",
      tags: "",
      jingleId: "",
      position: "start",
      volume: 100,
      coverArtSource: extractedCoverArt ? "original" : "default",
    },
  })

  useEffect(() => {
    if (open) {
      fetchJingles()
      fetchDefaultCoverArt()
      form.reset({
        title: extractedMetadata.title || filename.replace(/\.[^/.]+$/, ""),
        artist: extractedMetadata.artist || "",
        album: extractedMetadata.album || "",
        producer: "",
        year: "",
        tags: "",
        jingleId: "",
        position: "start",
        volume: 100,
        coverArtSource: extractedCoverArt ? "original" : "default",
      })
      setCoverArtPreview(extractedCoverArt)
      setCoverArtSource(extractedCoverArt ? "original" : "default")
    }
  }, [open, extractedMetadata, filename, extractedCoverArt, form])

  const fetchJingles = async () => {
    try {
      const response = await fetch("/api/jingles")
      if (response.ok) {
        const data = await response.json()
        setJingles(data)
      }
    } catch (error) {
      console.error("Failed to fetch jingles:", error)
    }
  }

  const fetchDefaultCoverArt = async () => {
    try {
      const response = await fetch("/api/cover-art")
      if (response.ok) {
        const data = await response.json()
        const defaultArt = data.find((art: any) => art.isDefault)
        if (defaultArt) {
          setDefaultCoverArt(defaultArt.fileUrl)
        }
      }
    } catch (error) {
      console.error("Failed to fetch default cover art:", error)
    }
  }

  const handleCoverArtSourceChange = (source: "original" | "default" | "custom") => {
    setCoverArtSource(source)
    form.setValue("coverArtSource", source)
    
    if (source === "original") {
      setCoverArtPreview(extractedCoverArt)
    } else if (source === "default") {
      setCoverArtPreview(defaultCoverArt)
    } else {
      setCoverArtPreview(null)
    }
  }

  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCoverArtPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      form.setValue("coverArtFile", file)
      setCoverArtSource("custom")
      form.setValue("coverArtSource", "custom")
    }
  }

  const onSubmit = async (values: ProcessingFormValues) => {
    setProcessing(true)
    try {
      await onProcess(values)
    } catch (error: any) {
      toast.error(error.message || "Failed to process audio")
    } finally {
      setProcessing(false)
    }
  }

  const volume = form.watch("volume") || 100
  const position = form.watch("position") || "start"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300 backdrop-blur-xl bg-background/95 border-2 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5" />
            Processing Audio
          </DialogTitle>
          <DialogDescription>
            Configure metadata, cover art, and jingle settings before finalizing
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Audio Preview */}
            <div className="rounded-2xl border-2 bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-sm p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Audio Preview</h3>
                {duration && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                  </Badge>
                )}
              </div>
              <AudioPlayer
                src={stagingUrl}
                title={form.watch("title") || filename}
                showWaveform={true}
                className="w-full"
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Metadata</TabsTrigger>
                <TabsTrigger value="cover">Cover Art</TabsTrigger>
                <TabsTrigger value="jingle">Jingle Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Title <span className="text-destructive">*</span>
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

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Genre
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select genre...</option>
                          <option value="Afrobeat">Afrobeat</option>
                          <option value="Afropop">Afropop</option>
                          <option value="Hip Hop">Hip Hop</option>
                          <option value="Amapiano">Amapiano</option>
                          <option value="Fuji">Fuji</option>
                          <option value="Fuji Fusion">Fuji Fusion</option>
                          <option value="Afrofusion">Afrofusion</option>
                          <option value="Afroswing">Afroswing</option>
                          <option value="Afro-adura">Afro-adura</option>
                          <option value="Highlife">Highlife</option>
                          <option value="Alte">Alte</option>
                          <option value="Dancehall">Dancehall</option>
                          <option value="Gqom">Gqom</option>
                          <option value="R&B Africa">R&B Africa</option>
                          <option value="Afrohouse">Afrohouse</option>
                          <option value="Bongo Flava">Bongo Flava</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Select the primary genre for this track
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="cover" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <FormLabel>Cover Art</FormLabel>
                  </div>

                  {/* Cover Art Preview */}
                  {coverArtPreview && (
                    <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 shadow-xl bg-muted group hover:scale-[1.02] transition-transform duration-300">
                      <img
                        src={coverArtPreview}
                        alt="Cover art preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}

                  {/* Cover Art Options */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={coverArtSource === "original" ? "default" : "outline"}
                      onClick={() => handleCoverArtSourceChange("original")}
                      disabled={!extractedCoverArt}
                      className="w-full"
                    >
                      Use Original
                    </Button>
                    <Button
                      type="button"
                      variant={coverArtSource === "default" ? "default" : "outline"}
                      onClick={() => handleCoverArtSourceChange("default")}
                      className="w-full"
                    >
                      Use Default
                    </Button>
                    <Button
                      type="button"
                      variant={coverArtSource === "custom" ? "default" : "outline"}
                      onClick={() => handleCoverArtSourceChange("custom")}
                      className="w-full"
                    >
                      Upload New
                    </Button>
                  </div>

                  {coverArtSource === "custom" && (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverArtUpload}
                        className="cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="jingle" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <FormLabel>Jingle Settings</FormLabel>
                  </div>

                  <FormField
                    control={form.control}
                    name="jingleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Jingle</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">No jingle</option>
                            {jingles.map((jingle) => (
                              <option key={jingle.id} value={jingle.id}>
                                {jingle.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("jingleId") && (
                    <>
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <TooltipProvider>
                                <RadioGroup
                                  value={position}
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    form.setValue("position", value as any)
                                  }}
                                  className="grid grid-cols-2 gap-4"
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="start" id="start" />
                                        <Label htmlFor="start" className="cursor-pointer flex-1">
                                          <div className="font-medium">Start</div>
                                          <div className="text-xs text-muted-foreground">Beginning</div>
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Jingle will play at the beginning</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="middle" id="middle" />
                                        <Label htmlFor="middle" className="cursor-pointer flex-1">
                                          <div className="font-medium">Middle</div>
                                          <div className="text-xs text-muted-foreground">Center</div>
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Jingle will play in the middle</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="end" id="end" />
                                        <Label htmlFor="end" className="cursor-pointer flex-1">
                                          <div className="font-medium">End</div>
                                          <div className="text-xs text-muted-foreground">Conclusion</div>
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Jingle will play at the end</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="start-end" id="start-end" />
                                        <Label htmlFor="start-end" className="cursor-pointer flex-1">
                                          <div className="font-medium">Start & End</div>
                                          <div className="text-xs text-muted-foreground">Both</div>
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Jingle will play at both start and end</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </RadioGroup>
                              </TooltipProvider>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <FormLabel className="cursor-help">Volume</FormLabel>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Adjust jingle volume (0-100%)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Badge variant="outline" className="font-mono">
                                {volume}%
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[volume]}
                                onValueChange={(value) => {
                                  field.onChange(value[0])
                                  form.setValue("volume", value[0])
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={processing}
                className="rounded-xl hover:scale-105 transition-transform duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={processing} 
                size="lg"
                className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                {processing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Process & Generate Final Audio
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

