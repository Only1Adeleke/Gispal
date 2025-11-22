"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerProps {
  src: string
  poster?: string
  cover?: string
  autoplayPreview?: boolean
  title?: string
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  className?: string
  showWaveform?: boolean
}

export function AudioPlayer({
  src,
  poster,
  cover,
  autoplayPreview = false,
  title,
  onPlay,
  onPause,
  onTimeUpdate,
  className,
  showWaveform = false,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showWaveformComponent, setShowWaveformComponent] = useState(false)
  const [wavesurferInstance, setWavesurferInstance] = useState<any>(null)

  // Load waveform lazily - ONLY on client side
  useEffect(() => {
    // Guard: Only run on client
    if (typeof window === "undefined") return

    if (showWaveform && waveformRef.current && !wavesurferInstance) {
      const loadWaveform = async () => {
        try {
          const Wavesurfer = (await import("wavesurfer.js")).default
          
          // Guard: Ensure we're still on client and container exists
          if (typeof window === "undefined" || !waveformRef.current) return
          
          const ws = Wavesurfer.create({
            container: waveformRef.current,
            waveColor: "#8b5cf6",
            progressColor: "#a78bfa",
            cursorColor: "#c4b5fd",
            barWidth: 2,
            barRadius: 3,
            height: 60,
            normalize: true,
            backend: "WebAudio",
            mediaControls: false,
          })

          ws.load(src)
          ws.on("ready", () => {
            setDuration(ws.getDuration())
            setIsLoading(false)
          })

          ws.on("play", () => {
            setIsPlaying(true)
            onPlay?.()
          })

          ws.on("pause", () => {
            setIsPlaying(false)
            onPause?.()
          })

          ws.on("timeupdate", (time: number) => {
            setCurrentTime(time)
            onTimeUpdate?.(time, ws.getDuration())
          })

          setWavesurferInstance(ws)
          setShowWaveformComponent(true)
        } catch (error) {
          console.warn("Failed to load waveform, using fallback:", error)
          setShowWaveformComponent(false)
          // Fallback: use regular audio element
          if (audioRef.current) {
            audioRef.current.load()
          }
        }
      }

      loadWaveform()
    } else if (!showWaveform && audioRef.current && typeof window !== "undefined") {
      audioRef.current.load()
    }
  }, [showWaveform, src, onPlay, onPause, onTimeUpdate, wavesurferInstance])

  // Setup audio element listeners (fallback when waveform not used)
  useEffect(() => {
    // Guard: Only run on client
    if (typeof window === "undefined") return
    
    const audio = audioRef.current
    if (!audio || showWaveformComponent) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime, audio.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [showWaveformComponent, onPlay, onPause, onTimeUpdate])

  // Autoplay preview
  useEffect(() => {
    // Guard: Only run on client
    if (typeof window === "undefined") return
    
    if (autoplayPreview && !isLoading && duration > 0) {
      const audio = audioRef.current
      if (audio && !showWaveformComponent) {
        audio.play().catch(() => {
          // Autoplay blocked, ignore
        })
      } else if (wavesurferInstance) {
        wavesurferInstance.play()
      }
    }
  }, [autoplayPreview, isLoading, duration, showWaveformComponent, wavesurferInstance])

  const togglePlayPause = useCallback(() => {
    if (typeof window === "undefined") return
    
    if (showWaveformComponent && wavesurferInstance) {
      wavesurferInstance.playPause()
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
        })
      }
    }
  }, [isPlaying, showWaveformComponent, wavesurferInstance])

  const handleSeek = useCallback(
    (value: number[]) => {
      if (typeof window === "undefined") return
      
      const newTime = value[0]
      if (showWaveformComponent && wavesurferInstance) {
        wavesurferInstance.seekTo(newTime / duration)
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
      setCurrentTime(newTime)
    },
    [duration, showWaveformComponent, wavesurferInstance]
  )

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      if (typeof window === "undefined") return
      
      const newVolume = value[0]
      setVolume(newVolume)
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }
      if (wavesurferInstance) {
        wavesurferInstance.setVolume(newVolume)
      }
      setIsMuted(newVolume === 0)
    },
    [wavesurferInstance]
  )

  const toggleMute = useCallback(() => {
    if (typeof window === "undefined") return
    
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (audioRef.current) {
      audioRef.current.muted = newMuted
    }
    if (wavesurferInstance) {
      wavesurferInstance.setMuted(newMuted)
    }
  }, [isMuted, wavesurferInstance])

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Cleanup waveform on unmount
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return
      
      if (wavesurferInstance) {
        try {
          wavesurferInstance.destroy()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [wavesurferInstance])

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Cover/Poster */}
        {(cover || poster) && (
          <div className="relative aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-muted">
            <img
              src={cover || poster}
              alt={title || "Audio cover"}
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="text-center">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
          </div>
        )}

        {/* Waveform */}
        {showWaveform && (
          <div
            ref={waveformRef}
            className={cn(
              "w-full h-[60px] rounded-md bg-muted",
              !showWaveformComponent && "hidden"
            )}
          />
        )}

        {/* Controls */}
        <div className="space-y-3">
          {/* Seek Bar */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={isLoading || duration === 0}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePlayPause}
                      disabled={isLoading || duration === 0}
                      className="h-10 w-10"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPlaying ? "Pause" : "Play"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="h-8 w-8"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isMuted ? "Unmute" : "Mute"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden audio element for fallback */}
        {!showWaveformComponent && (
          <audio ref={audioRef} src={src} preload="metadata" />
        )}
      </div>
    </Card>
  )
}

