// Plan restrictions and feature checks based on Gispal specification

export type Plan = "free" | "daily_unlimited" | "daily_250mb" | "weekly_unlimited" | "weekly_300mb" | "monthly_unlimited" | "monthly_5000mb"

export function isProPlan(plan: Plan): boolean {
  return plan !== "free"
}

export function getMaxJingles(plan: Plan): number {
  return isProPlan(plan) ? 3 : 1
}

export function getMaxCoverArts(plan: Plan): number {
  return isProPlan(plan) ? Infinity : 1
}

export function canUseExtractedCoverArt(plan: Plan): boolean {
  return isProPlan(plan)
}

export function canFullExport(plan: Plan): boolean {
  return isProPlan(plan)
}

export function canSelectJinglePosition(plan: Plan): boolean {
  return isProPlan(plan)
}

export function canControlJingleVolume(plan: Plan): boolean {
  return isProPlan(plan)
}

export function canSavePermanently(plan: Plan): boolean {
  return isProPlan(plan)
}

export function getTempStorageDuration(plan: Plan): number {
  // 10 minutes for all users (spec says 10 minutes for free)
  return 10 * 60 * 1000 // 10 minutes in milliseconds
}

export function getPreviewDuration(): number {
  return 30 // 30 seconds for all users
}

