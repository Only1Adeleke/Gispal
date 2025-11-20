import { betterAuth } from "better-auth"
import { db } from "../db"

// For development, we'll use a custom adapter
// In production, use prismaAdapter with actual Prisma client
const customAdapter = {
  user: {
    async create(data: any) {
      const user = await db.users.create({
        email: data.email,
        name: data.name,
        plan: "free",
        bandwidthLimit: 100 * 1024 * 1024,
      })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    },
    async getById(id: string) {
      const user = await db.users.findById(id)
      if (!user) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    },
    async getByEmail(email: string) {
      const user = await db.users.findByEmail(email)
      if (!user) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    },
    async update(id: string, data: any) {
      const user = await db.users.update(id, data)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    },
  },
  session: {
    async create(data: any) {
      return {
        id: crypto.randomUUID(),
        userId: data.userId,
        expiresAt: data.expiresAt,
        token: data.token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    async getByToken(token: string) {
      // In production, implement session storage
      return null
    },
    async delete(id: string) {
      // In production, implement session deletion
    },
  },
  account: {
    async create(data: any) {
      return {
        id: crypto.randomUUID(),
        userId: data.userId,
        accountId: data.accountId,
        providerId: data.providerId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        password: data.password,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    async getByProvider(providerId: string, accountId: string) {
      return null
    },
  },
}

export const auth = betterAuth({
  database: customAdapter as any,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

