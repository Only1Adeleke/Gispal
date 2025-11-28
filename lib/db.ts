// Database types and utilities
// In production, replace with your actual database client (Prisma, Drizzle, etc.)

import { randomUUID } from "crypto"
// Import persistence functions
import { loadJingles, saveJingles, loadCoverArts, saveCoverArts, loadAudios, saveAudios } from "./db-persistence"

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
  apiKey?: string
  apiKeyCreatedAt?: Date
  plan: "free" | "daily_unlimited" | "daily_250mb" | "weekly_unlimited" | "weekly_300mb" | "monthly_unlimited" | "monthly_5000mb"
  planExpiresAt?: Date
  bandwidthUsed: number // in bytes
  bandwidthLimit: number // in bytes
  role: "admin" | "user"
  banned: boolean
}

export interface Jingle {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileSize: number
  duration?: number
  createdAt: Date
}

export interface CoverArt {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileSize: number
  isDefault: boolean
  createdAt: Date
}

export interface Mix {
  id: string
  userId: string
  audioUrl: string
  jingleId?: string
  coverArtId?: string
  position: "start" | "middle" | "end"
  outputUrl: string
  isPreview: boolean
  createdAt: Date
}

export interface Audio {
  id: string
  title: string
  tags: string | null
  url: string
  duration: number | null
  createdAt: Date
  parentId?: string // ID of the original audio if this is a mixed version
  artist?: string
  album?: string
  producer?: string
  year?: string
}

export interface ApiKey {
  id: string
  userId: string
  key: string
  createdAt: number
  lastUsedAt?: number
  usageCount: number
  active: boolean
}

export interface UsageHistory {
  type: string
  timestamp: number
  meta?: any
}

export interface Usage {
  userId: string
  totalMixes: number
  totalUploads: number
  totalDownloads: number
  wordpressApiRequests: number
  history: UsageHistory[]
}

export interface Staging {
  id: string
  userId: string
  filePath: string
  filename: string
  duration?: number
  extractedCoverArt?: string
  extractedMetadata?: any
  createdAt: Date
}

// In-memory storage for development
// Replace with actual database in production
const users: Map<string, User> = new Map()
let jingles: Map<string, Jingle> = new Map()
let coverArts: Map<string, CoverArt> = new Map()
const mixes: Map<string, Mix> = new Map()
const audios: Map<string, Audio> = new Map()
const apiKeys: Map<string, ApiKey> = new Map()
const usage: Map<string, Usage> = new Map()
const staging: Map<string, Staging> = new Map()

// Load persisted data on module initialization
let persistenceInitialized = false
let persistencePromise: Promise<void> | null = null

async function initializePersistence() {
  if (persistenceInitialized) return
  if (persistencePromise) return persistencePromise
  
  persistencePromise = (async () => {
    try {
      jingles = await loadJingles()
      coverArts = await loadCoverArts()
      const loadedAudios = await loadAudios()
      // Merge loaded audios into the in-memory map
      for (const [id, audio] of loadedAudios.entries()) {
        audios.set(id, audio)
      }
      persistenceInitialized = true
      console.log(`Loaded ${jingles.size} jingles, ${coverArts.size} cover arts, and ${loadedAudios.size} audios from disk`)
    } catch (error) {
      console.error("Failed to load persisted data:", error)
    } finally {
      persistencePromise = null
    }
  })()
  
  return persistencePromise
}

// Initialize on module load (non-blocking)
initializePersistence().catch(console.error)

export const db = {
  users: {
    findAll: async (): Promise<User[]> => {
      return Array.from(users.values())
    },
    findById: async (id: string): Promise<User | null> => {
      return users.get(id) || null
    },
    findByEmail: async (email: string): Promise<User | null> => {
      for (const user of users.values()) {
        if (user.email === email) return user
      }
      return null
    },
    findByApiKey: async (apiKey: string): Promise<User | null> => {
      for (const user of users.values()) {
        if (user.apiKey === apiKey) return user
      }
      return null
    },
    create: async (data: Omit<User, "id" | "createdAt" | "updatedAt" | "bandwidthUsed" | "role" | "banned">, id?: string): Promise<User> => {
      const user: User = {
        ...data,
        id: id || crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bandwidthUsed: 0,
        bandwidthLimit: getBandwidthLimit(data.plan),
        role: "user",
        banned: false,
      }
      users.set(user.id, user)
      return user
    },
    update: async (id: string, data: Partial<User>): Promise<User> => {
      const user = users.get(id)
      if (!user) throw new Error("User not found")
      const updated = { ...user, ...data, updatedAt: new Date() }
      users.set(id, updated)
      return updated
    },
    delete: async (id: string): Promise<void> => {
      users.delete(id)
    },
  },
  jingles: {
    findAll: async (): Promise<Jingle[]> => {
      await initializePersistence()
      return Array.from(jingles.values())
    },
    findByUserId: async (userId: string): Promise<Jingle[]> => {
      await initializePersistence()
      return Array.from(jingles.values()).filter(j => j.userId === userId)
    },
    findById: async (id: string): Promise<Jingle | null> => {
      await initializePersistence()
      return jingles.get(id) || null
    },
    create: async (data: Omit<Jingle, "id" | "createdAt">): Promise<Jingle> => {
      await initializePersistence()
      const jingle: Jingle = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      jingles.set(jingle.id, jingle)
      await saveJingles(jingles)
      return jingle
    },
    delete: async (id: string): Promise<void> => {
      await initializePersistence()
      jingles.delete(id)
      await saveJingles(jingles)
    },
  },
  coverArts: {
    findAll: async (): Promise<CoverArt[]> => {
      await initializePersistence()
      return Array.from(coverArts.values())
    },
    findByUserId: async (userId: string): Promise<CoverArt[]> => {
      await initializePersistence()
      return Array.from(coverArts.values()).filter(c => c.userId === userId)
    },
    findById: async (id: string): Promise<CoverArt | null> => {
      await initializePersistence()
      return coverArts.get(id) || null
    },
    create: async (data: Omit<CoverArt, "id" | "createdAt">): Promise<CoverArt> => {
      await initializePersistence()
      const coverArt: CoverArt = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      coverArts.set(coverArt.id, coverArt)
      await saveCoverArts(coverArts)
      return coverArt
    },
    setDefault: async (userId: string, id: string): Promise<void> => {
      await initializePersistence()
      // Unset all defaults for user
      for (const [key, art] of coverArts.entries()) {
        if (art.userId === userId) {
          coverArts.set(key, { ...art, isDefault: false })
        }
      }
      // Set new default
      const art = coverArts.get(id)
      if (art) {
        coverArts.set(id, { ...art, isDefault: true })
      }
      await saveCoverArts(coverArts)
    },
    delete: async (id: string): Promise<void> => {
      await initializePersistence()
      coverArts.delete(id)
      await saveCoverArts(coverArts)
    },
  },
  mixes: {
    findAll: async (): Promise<Mix[]> => {
      return Array.from(mixes.values())
    },
    findByUserId: async (userId: string): Promise<Mix[]> => {
      return Array.from(mixes.values()).filter(m => m.userId === userId)
    },
    findById: async (id: string): Promise<Mix | null> => {
      return mixes.get(id) || null
    },
    create: async (data: Omit<Mix, "id" | "createdAt">): Promise<Mix> => {
      const mix: Mix = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      mixes.set(mix.id, mix)
      return mix
    },
    delete: async (id: string): Promise<void> => {
      mixes.delete(id)
    },
  },
  audios: {
    findAll: async (): Promise<Audio[]> => {
      return Array.from(audios.values()).sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )
    },
    findById: async (id: string): Promise<Audio | null> => {
      return audios.get(id) || null
    },
    create: async (data: Omit<Audio, "id" | "createdAt">, id?: string): Promise<Audio> => {
      const audio: Audio = {
        ...data,
        id: id || crypto.randomUUID(),
        createdAt: new Date(),
      }
      audios.set(audio.id, audio)
      // Persist to disk
      await saveAudios(audios).catch((error) => {
        console.error("Failed to persist audios:", error)
      })
      return audio
    },
    update: async (id: string, data: Partial<Audio>): Promise<Audio | null> => {
      const audio = audios.get(id)
      if (!audio) return null
      
      const updatedAudio: Audio = {
        ...audio,
        ...data,
      }
      audios.set(id, updatedAudio)
      // Persist to disk
      await saveAudios(audios).catch((error) => {
        console.error("Failed to persist audios:", error)
      })
      return updatedAudio
    },
    delete: async (id: string): Promise<void> => {
      audios.delete(id)
      // Persist to disk
      await saveAudios(audios).catch((error) => {
        console.error("Failed to persist audios:", error)
      })
    },
  },
  apiKeys: {
    findByUserId: async (userId: string): Promise<ApiKey[]> => {
      return Array.from(apiKeys.values()).filter(k => k.userId === userId && k.active)
    },
    findByKey: async (key: string): Promise<ApiKey | null> => {
      for (const apiKey of apiKeys.values()) {
        if (apiKey.key === key && apiKey.active) return apiKey
      }
      return null
    },
    create: async (data: Omit<ApiKey, "id">): Promise<ApiKey> => {
      const apiKey: ApiKey = {
        ...data,
        id: crypto.randomUUID(),
      }
      apiKeys.set(apiKey.id, apiKey)
      return apiKey
    },
    update: async (id: string, data: Partial<ApiKey>): Promise<ApiKey> => {
      const key = apiKeys.get(id)
      if (!key) throw new Error("API key not found")
      const updated = { ...key, ...data }
      apiKeys.set(id, updated)
      return updated
    },
    delete: async (id: string): Promise<void> => {
      const key = apiKeys.get(id)
      if (key) {
        apiKeys.set(id, { ...key, active: false })
      }
    },
  },
  usage: {
    findByUserId: async (userId: string): Promise<Usage | null> => {
      return usage.get(userId) || null
    },
    getOrCreate: async (userId: string): Promise<Usage> => {
      let userUsage = usage.get(userId)
      if (!userUsage) {
        userUsage = {
          userId,
          totalMixes: 0,
          totalUploads: 0,
          totalDownloads: 0,
          wordpressApiRequests: 0,
          history: [],
        }
        usage.set(userId, userUsage)
      }
      return userUsage
    },
    record: async (userId: string, type: string, meta?: any): Promise<void> => {
      const userUsage = await db.usage.getOrCreate(userId)
      
      // Update counters
      if (type === "mix") userUsage.totalMixes++
      else if (type === "upload") userUsage.totalUploads++
      else if (type === "download") userUsage.totalDownloads++
      else if (type === "wordpress_api") userUsage.wordpressApiRequests++
      
      // Add to history
      userUsage.history.push({
        type,
        timestamp: Date.now(),
        meta,
      })
      
      // Keep only last 1000 history entries
      if (userUsage.history.length > 1000) {
        userUsage.history = userUsage.history.slice(-1000)
      }
      
      usage.set(userId, userUsage)
    },
    getTodayCount: async (userId: string, type: string): Promise<number> => {
      const userUsage = await db.usage.getOrCreate(userId)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime()
      
      return userUsage.history.filter(
        h => h.type === type && h.timestamp >= todayTimestamp
      ).length
    },
    delete: async (userId: string): Promise<void> => {
      usage.delete(userId)
    },
    findById: async (userId: string): Promise<Usage | null> => {
      return usage.get(userId) || null
    },
  },
  staging: {
    findById: async (id: string): Promise<Staging | null> => {
      return staging.get(id) || null
    },
    create: async (data: Omit<Staging, "id" | "createdAt">, id?: string): Promise<Staging> => {
      const stagingEntry: Staging = {
        ...data,
        id: id || randomUUID(),
        createdAt: new Date(),
      }
      staging.set(stagingEntry.id, stagingEntry)
      return stagingEntry
    },
    delete: async (id: string): Promise<void> => {
      staging.delete(id)
    },
    findByUserId: async (userId: string): Promise<Staging[]> => {
      return Array.from(staging.values()).filter(s => s.userId === userId)
    },
  },
}

function getBandwidthLimit(plan: User["plan"]): number {
  const limits: Record<User["plan"], number> = {
    free: 100 * 1024 * 1024, // 100MB
    daily_unlimited: Infinity,
    daily_250mb: 250 * 1024 * 1024,
    weekly_unlimited: Infinity,
    weekly_300mb: 300 * 1024 * 1024,
    monthly_unlimited: Infinity,
    monthly_5000mb: 5000 * 1024 * 1024,
  }
  return limits[plan]
}

