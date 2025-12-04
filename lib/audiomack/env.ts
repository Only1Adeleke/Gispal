/**
 * Audiomack OAuth environment variable validation
 */

export interface AudiomackConfig {
  consumerKey: string
  consumerSecret: string
  redirectUri?: string
  encryptionKey?: string
}

/**
 * Get and validate Audiomack OAuth credentials
 */
export function getAudiomackConfig(): AudiomackConfig {
  const consumerKey = process.env.AUDIOMACK_CONSUMER_KEY || ""
  const consumerSecret = process.env.AUDIOMACK_CONSUMER_SECRET || ""
  const redirectUri = process.env.AUDIOMACK_REDIRECT_URI || (process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/audiomack/auth/callback`
    : "http://localhost:3000/api/audiomack/auth/callback")
  const encryptionKey = process.env.AUDIOMACK_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || ""

  console.log("[AUDIOMACK-ENV] Loading config:")
  console.log("[AUDIOMACK-ENV]   Consumer key present:", !!consumerKey)
  console.log("[AUDIOMACK-ENV]   Consumer secret present:", !!consumerSecret)
  console.log("[AUDIOMACK-ENV]   Redirect URI:", redirectUri)
  console.log("[AUDIOMACK-ENV]   Encryption key present:", !!encryptionKey)

  return {
    consumerKey,
    consumerSecret,
    redirectUri,
    encryptionKey,
  }
}

/**
 * Validate that required Audiomack credentials are configured
 * @throws Error if credentials are missing
 */
export function validateAudiomackConfig(): void {
  const config = getAudiomackConfig()

  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error(
      "Audiomack OAuth credentials not configured. " +
      "Please set AUDIOMACK_CONSUMER_KEY and AUDIOMACK_CONSUMER_SECRET environment variables."
    )
  }
}

/**
 * Test if Audiomack config is valid (for testing)
 */
export function testConfig(): boolean {
  try {
    validateAudiomackConfig()
    return true
  } catch {
    return false
  }
}

/**
 * Get config or throw error
 */
export function requireAudiomackConfig(): AudiomackConfig {
  validateAudiomackConfig()
  return getAudiomackConfig()
}

