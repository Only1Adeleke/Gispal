"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

// Top 15 popular and trending genres including Nigerian genres
const GENRES = [
  // Nigerian genres
  "Afrobeats",
  "Afro-pop",
  "Afro-fusion",
  "Nigerian Hip-Hop",
  "Highlife",
  "Juju",
  "Fuji",
  // Popular international genres
  "Pop",
  "Hip-Hop",
  "R&B",
  "Rock",
  "Electronic",
  "Jazz",
  "Reggae",
  "Country",
  "Classical",
]

interface GenreSelectProps {
  value: string
  onChange: (genre: string) => void
  autoFilled?: boolean
}

export function GenreSelect({ value, onChange, autoFilled }: GenreSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="genre">Genre</Label>
        {autoFilled && (
          <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
            Auto-filled
          </Badge>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">The musical genre. Includes popular Nigerian genres like Afrobeats and Afro-pop.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger id="genre" className="bg-zinc-900/50 border-zinc-800/50 focus:border-violet-500/50">
          <SelectValue placeholder="Select genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {GENRES.map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
