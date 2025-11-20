import { db } from "../db"
import crypto from "crypto"

export async function generateApiKey(userId: string): Promise<string> {
  const apiKey = `gispal_${crypto.randomBytes(32).toString("hex")}`
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")
  
  await db.users.update(userId, {
    apiKey: hashedKey,
    apiKeyCreatedAt: new Date(),
  })
  
  return apiKey
}

export async function verifyApiKey(apiKey: string): Promise<string | null> {
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")
  const user = await db.users.findByApiKey(hashedKey)
  return user?.id || null
}

export async function rotateApiKey(userId: string): Promise<string> {
  return generateApiKey(userId)
}

