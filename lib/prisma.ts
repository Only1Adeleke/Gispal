// Prisma client - only initialize if @prisma/client is available
// This file may not be used if Drizzle is the primary ORM
// Using lazy initialization to avoid webpack chunk issues

let prismaInstance: any = null
let prismaInitialized = false

function initializePrisma() {
  if (prismaInitialized) {
    return prismaInstance
  }

  try {
    // Lazy require - only when actually needed
    // This prevents webpack from trying to bundle Prisma at module load time
    if (typeof window === "undefined") {
      // Server-side only - use dynamic require inside function
      const prismaModule = require("@prisma/client")
      const PrismaClient = prismaModule.PrismaClient
      const globalForPrisma = globalThis as unknown as {
        prisma: typeof PrismaClient | undefined
      }

      prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      })

      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance
      prismaInitialized = true
    }
  } catch (error) {
    // Prisma not available - this is OK if using Drizzle
    // Only log in development to avoid noise
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma client not available - using Drizzle ORM instead")
    }
    prismaInitialized = true // Mark as initialized to avoid repeated attempts
  }

  return prismaInstance
}

// Export getter function - lazy initialization
export function getPrisma() {
  return initializePrisma()
}

// For backward compatibility - lazy getter
export const prisma = initializePrisma()
