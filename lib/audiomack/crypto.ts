/**
 * Encryption utilities for Audiomack tokens
 */

import crypto from "node:crypto"
import { getAudiomackConfig } from "./env"

const ALGORITHM = "aes-256-cbc"

/**
 * Get encryption key (32 bytes for AES-256)
 */
function getEncryptionKey(): Buffer {
  const config = getAudiomackConfig()
  const key = config.encryptionKey || process.env.ENCRYPTION_KEY || "default-key-change-in-production-32-chars!!"
  
  // Ensure key is 32 bytes for AES-256
  if (key.length < 32) {
    // Pad or hash to 32 bytes
    return crypto.createHash("sha256").update(key).digest()
  }
  
  return Buffer.from(key.slice(0, 32))
}

/**
 * Encrypt a string value
 */
export function encrypt(value: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(value, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  // Prepend IV to encrypted data
  return iv.toString("hex") + ":" + encrypted
}

/**
 * Decrypt a string value
 */
export function decrypt(encryptedValue: string): string {
  const key = getEncryptionKey()
  const [ivHex, encrypted] = encryptedValue.split(":")
  
  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted value format")
  }
  
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}

