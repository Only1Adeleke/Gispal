"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface PremiumPlayerProps {
  src: string
  coverArt?: string
  title?: string
  artist?: string
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  className?: string
}

export function PremiumPlayer({
  src,
  coverArt,
  title,
  artist,
  onPlay,
  onPause,
  onTimeUpdate,
  className,
}: PremiumPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [wavesurferInstance, setWavesurferInstance] = useState<any>(null)

  // Load waveform lazily
  useEffect(() => {
    if (typeof window === "undefined") return

    if (waveformRef.current && !wavesurferInstance) {
      const loadWaveform = async () => {
        try {
          const Wavesurfer = (await import("wavesurfer.js")).default
          
          if (typeof window === "undefined" || !waveformRef.current) return
          
          const ws = Wavesurfer.create({
            container: waveformRef.current,
            waveColor: "rgba(255, 255, 255, 0.3)",
            progressColor: "#a78bfa",
            cursorColor: "#ffffff",
            barWidth: 3,
            barRadius: 4,
            height: 120,
            normalize: true,
            backend: "WebAudio",
            mediaControls: false,
            interact: true,
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
        } catch (error) {
          console.warn("Failed to load waveform:", error)
          setIsLoading(false)
          if (audioRef.current) {
            audioRef.current.load()
          }
        }
      }

      loadWaveform()
    } else if (audioRef.current && typeof window !== "undefined" && !wavesurferInstance) {
      audioRef.current.load()
    }
  }, [src, onPlay, onPause, onTimeUpdate, wavesurferInstance])

  // Setup audio element listeners (fallback)
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const audio = audioRef.current
    if (!audio || wavesurferInstance) return

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
  }, [wavesurferInstance, onPlay, onPause, onTimeUpdate])

  const togglePlayPause = useCallback(() => {
    if (typeof window === "undefined") return
    
    if (wavesurferInstance) {
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
  }, [isPlaying, wavesurferInstance])

  const handleSeek = useCallback(
    (value: number[]) => {
      if (typeof window === "undefined") return
      
      const newTime = value[0]
      if (wavesurferInstance) {
        wavesurferInstance.seekTo(newTime / duration)
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
      setCurrentTime(newTime)
    },
    [duration, wavesurferInstance]
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
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900",
        "shadow-2xl",
        className
      )}
      style={{
        backgroundImage: coverArt
          ? `url(${coverArt})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay on top of background image */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
      
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 20px
          )`,
        }}
      />
      
      {/* Animated gradient overlay for dynamic effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-pink-900/40 animate-pulse" />

      <div className="relative z-10 p-8 space-y-6">
        {/* Cover Art and Info */}
        <div className="flex items-start gap-6">
          {/* Cover Art */}
          <div className="relative flex-shrink-0 group">
            <div className="w-52 h-52 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/30 transition-all duration-300 group-hover:scale-105 group-hover:ring-white/50">
              {coverArt ? (
                <img
                  src={coverArt}
                  alt={title || "Cover"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <div className="text-white text-5xl animate-pulse">♪</div>
                </div>
              )}
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl backdrop-blur-sm">
                <Spinner className="h-10 w-10 text-white" />
              </div>
            )}
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>

          {/* Title and Artist */}
          <div className="flex-1 pt-4">
            {artist && (
              <p className="text-purple-300 text-sm font-semibold mb-2 tracking-wide uppercase">
                {artist}
              </p>
            )}
            <h2 className="text-white text-3xl font-bold mb-3 line-clamp-2 drop-shadow-lg">
              {title || "Unknown Track"}
            </h2>
            <div className="flex items-center gap-3 text-purple-200/90 text-xs font-medium">
              <span className="px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">STEREO</span>
              <span>•</span>
              <span className="px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">HQ</span>
            </div>
          </div>
        </div>

        {/* Waveform - Single waveform with integrated progress */}
        <div className="relative">
          <div
            ref={waveformRef}
            className="w-full h-[120px] rounded-lg bg-black/30 backdrop-blur-sm border border-white/10"
            style={{
              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
            }}
          />
          {!wavesurferInstance && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="h-8 w-8 text-white/50" />
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-sm text-white/80 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="space-y-4">

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white hover:bg-white/20 rounded-full transition-all hover:scale-110"
              disabled
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              onClick={togglePlayPause}
              disabled={isLoading || duration === 0}
              className="h-16 w-16 rounded-full bg-white text-purple-900 hover:bg-purple-100 shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 active:scale-95"
            >
              {isLoading ? (
                <Spinner className="h-7 w-7" />
              ) : isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-1" fill="currentColor" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white hover:bg-white/20 rounded-full transition-all hover:scale-110"
              disabled
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-10 w-10 text-white hover:bg-white/20 rounded-full transition-all hover:scale-110"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-40"
            />
            <span className="text-white/70 text-sm font-medium min-w-[3rem] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Hidden audio element for fallback */}
      {!wavesurferInstance && (
        <audio ref={audioRef} src={src} preload="metadata" />
      )}
    </div>
  )
}

