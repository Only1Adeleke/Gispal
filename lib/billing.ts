// Billing and usage limit checks for Phase 4
import { User } from "./db"
import { Usage } from "./db"

export interface LimitCheck {
  canMix: boolean
  canUpload: boolean
  canUseWordPressAPI: boolean
  canIngestExternal: boolean
  reason?: string
}

// Get today's date in YYYY-MM-DD format for daily limits
function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

// Count operations for today from usage history
function getTodayCount(usage: Usage | null, type: string): number {
  if (!usage) return 0
  const todayKey = getTodayKey()
  return usage.history.filter(
    (h) => h.type === type && new Date(h.timestamp).toISOString().startsWith(todayKey)
  ).length
}

export function checkLimits(user: User, usage: Usage | null): LimitCheck {
  const isPro = user.plan !== "free"

  // Pro users have unlimited access
  if (isPro) {
    return {
      canMix: true,
      canUpload: true,
      canUseWordPressAPI: true,
      canIngestExternal: true,
    }
  }

  // Free tier limits
  const mixesToday = getTodayCount(usage, "mix")
  const uploadsToday = getTodayCount(usage, "upload")
  const externalIngestsToday = getTodayCount(usage, "external_ingest")

  const result: LimitCheck = {
    canMix: mixesToday < 5,
    canUpload: uploadsToday < 5,
    canUseWordPressAPI: false,
    canIngestExternal: true, // Allowed but with length restrictions
  }

  if (!result.canMix) {
    result.reason = "Free tier limit: Maximum 5 mixes per day. Upgrade to PRO for unlimited mixing."
  } else if (!result.canUpload) {
    result.reason = "Free tier limit: Maximum 5 uploads per day. Upgrade to PRO for unlimited uploads."
  } else if (!result.canUseWordPressAPI) {
    result.reason = "WordPress API is only available for PRO users. Upgrade to PRO to use the WordPress plugin."
  }

  return result
}

// Check if audio duration is within free tier limits
export function checkAudioDurationLimit(plan: string, duration: number | null): { allowed: boolean; reason?: string } {
  if (plan !== "free" || !duration) {
    return { allowed: true }
  }

  // Free tier: max 5 minutes (300 seconds) for uploads
  if (duration > 300) {
    return {
      allowed: false,
      reason: "Free tier limit: Maximum 5 minutes per audio file. Upgrade to PRO for longer files.",
    }
  }

  return { allowed: true }
}

// Check if jingle duration is within free tier limits
export function checkJingleDurationLimit(plan: string, duration: number | null): { allowed: boolean; reason?: string } {
  if (plan !== "free" || !duration) {
    return { allowed: true }
  }

  // Free tier: max 120 seconds (2 minutes) for jingles
  if (duration > 120) {
    return {
      allowed: false,
      reason: "Free tier limit: Maximum 2 minutes per jingle. Upgrade to PRO for longer jingles.",
    }
  }

  return { allowed: true }
}

// Check if external ingestion duration is within free tier limits
export function checkExternalIngestDurationLimit(plan: string, duration: number | null): { allowed: boolean; reason?: string } {
  if (plan !== "free" || !duration) {
    return { allowed: true }
  }

  // Free tier: max 4 minutes (240 seconds) for external ingestion
  if (duration > 240) {
    return {
      allowed: false,
      reason: "Free tier limit: Maximum 4 minutes for external ingestion (YouTube/Audiomack). Upgrade to PRO for longer files.",
    }
  }

  return { allowed: true }
}
