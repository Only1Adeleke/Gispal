// Database types and utilities
// In production, replace with your actual database client (Prisma, Drizzle, etc.)

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

// In-memory storage for development
// Replace with actual database in production
const users: Map<string, User> = new Map()
const jingles: Map<string, Jingle> = new Map()
const coverArts: Map<string, CoverArt> = new Map()
const mixes: Map<string, Mix> = new Map()

export const db = {
  users: {
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
    create: async (data: Omit<User, "id" | "createdAt" | "updatedAt" | "bandwidthUsed">): Promise<User> => {
      const user: User = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bandwidthUsed: 0,
        bandwidthLimit: getBandwidthLimit(data.plan),
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
  },
  jingles: {
    findByUserId: async (userId: string): Promise<Jingle[]> => {
      return Array.from(jingles.values()).filter(j => j.userId === userId)
    },
    findById: async (id: string): Promise<Jingle | null> => {
      return jingles.get(id) || null
    },
    create: async (data: Omit<Jingle, "id" | "createdAt">): Promise<Jingle> => {
      const jingle: Jingle = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      jingles.set(jingle.id, jingle)
      return jingle
    },
    delete: async (id: string): Promise<void> => {
      jingles.delete(id)
    },
  },
  coverArts: {
    findByUserId: async (userId: string): Promise<CoverArt[]> => {
      return Array.from(coverArts.values()).filter(c => c.userId === userId)
    },
    findById: async (id: string): Promise<CoverArt | null> => {
      return coverArts.get(id) || null
    },
    create: async (data: Omit<CoverArt, "id" | "createdAt">): Promise<CoverArt> => {
      const coverArt: CoverArt = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      coverArts.set(coverArt.id, coverArt)
      return coverArt
    },
    setDefault: async (userId: string, id: string): Promise<void> => {
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
    },
    delete: async (id: string): Promise<void> => {
      coverArts.delete(id)
    },
  },
  mixes: {
    create: async (data: Omit<Mix, "id" | "createdAt">): Promise<Mix> => {
      const mix: Mix = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      mixes.set(mix.id, mix)
      return mix
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

