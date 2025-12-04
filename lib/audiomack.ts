// Audiomack API integration
import OAuth from "oauth-1.0a"
import crypto from "node:crypto"

const API_BASE = "https://api.audiomack.com/v1"

// Note: OAuth functionality has been moved to lib/audiomack/client.ts
// This file now only contains utility functions that don't require OAuth

// Parse Audiomack URL to extract artist slug and track slug
export function parseAudiomackUrl(url: string): { artistSlug: string; trackSlug: string; type: "song" | "album" } | null {
  try {
    const urlObj = new URL(url)
    
    // Audiomack URLs can be:
    // https://audiomack.com/artist/song
    // https://audiomack.com/artist/album/album-name
    // https://www.audiomack.com/artist/song
    
    if (!urlObj.hostname.includes("audiomack.com")) {
      return null
    }
    
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    
    if (pathParts.length < 2) {
      return null
    }
    
    const artistSlug = pathParts[0]
    const trackSlug = pathParts[1]
    
    // Determine if it's a song or album (albums typically have more path segments)
    // For simplicity, we'll assume it's a song unless we detect otherwise
    const type: "song" | "album" = pathParts.length > 2 ? "album" : "song"
    
    return { artistSlug, trackSlug, type }
  } catch {
    return null
  }
}

// Make authenticated OAuth request (legacy - use makeAuthenticatedRequest from client.ts)
async function makeOAuthRequest(url: string, method: "GET" | "POST" = "GET", body?: any, userId?: string): Promise<Response> {
  // Use new client implementation
  const { makeAuthenticatedRequest } = await import("./audiomack/client")
  return makeAuthenticatedRequest(url, method, userId, body)
}

// Make non-authenticated request (for public tracks)
async function makePublicRequest(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "Gispal/1.0",
    },
  })
}

// Get track info from Audiomack API
export async function getAudiomackTrackInfo(artistSlug: string, trackSlug: string, type: "song" | "album" = "song", userId?: string): Promise<any> {
  const url = `${API_BASE}/music/${type}/${artistSlug}/${trackSlug}`
  console.log(`[AUDIOMACK] Getting track info: ${url}`)
  console.log(`[AUDIOMACK] UserId: ${userId || "none"}`)
  
  try {
    // Try public request first (works for public tracks)
    console.log(`[AUDIOMACK] Attempting public request for track info`)
    const { makePublicRequest } = await import("./audiomack/client")
    const response = await makePublicRequest(url)
    
    console.log(`[AUDIOMACK] Public request response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      // If public request fails, try with OAuth (if userId provided AND credentials configured)
      if (response.status === 401 && userId) {
        console.log(`[AUDIOMACK] Public request returned 401, checking if OAuth credentials are configured...`)
        
        // Check if OAuth credentials are configured before trying
        try {
          const { testConfig } = await import("./audiomack/env")
          if (!testConfig()) {
            console.warn(`[AUDIOMACK] OAuth credentials not configured, cannot use authenticated request`)
            const errorText = await response.text()
            throw new Error(`Failed to fetch track info: ${response.status} ${response.statusText}. This track may require authentication, but OAuth credentials are not configured.`)
          }
          
          console.log(`[AUDIOMACK] OAuth credentials configured, trying authenticated request with userId: ${userId}`)
          const { makeAuthenticatedRequest } = await import("./audiomack/client")
          const oauthResponse = await makeAuthenticatedRequest(url, "GET", userId)
          if (!oauthResponse.ok) {
            const errorText = await oauthResponse.text()
            console.error(`[AUDIOMACK] Authenticated request failed: ${oauthResponse.status} ${errorText}`)
            throw new Error(`Failed to fetch track info: ${oauthResponse.statusText}`)
          }
          const data = await oauthResponse.json()
          console.log(`[AUDIOMACK] Successfully fetched track info via authenticated request`)
          return data.results || data
        } catch (oauthError: any) {
          console.error(`[AUDIOMACK] OAuth request failed:`, oauthError.message)
          // If OAuth fails, return the original error
          throw new Error(`Failed to fetch track info: ${response.statusText}. ${oauthError.message}`)
        }
      } else {
        const errorText = await response.text()
        console.error(`[AUDIOMACK] Public request failed: ${response.status} ${errorText}`)
        throw new Error(`Failed to fetch track info: ${response.status} ${response.statusText}`)
      }
    }
    
    const data = await response.json()
    console.log(`[AUDIOMACK] Successfully fetched track info via public request`)
    return data.results || data
  } catch (error: any) {
    console.error(`[AUDIOMACK] Error getting track info:`, error.message)
    throw new Error(`Audiomack API error: ${error.message}`)
  }
}

// Get streaming URL for a track
export async function getAudiomackStreamingUrl(musicId: string, userId?: string): Promise<string> {
  const url = `${API_BASE}/music/${musicId}/play`
  console.log(`[AUDIOMACK] Getting streaming URL for music ID: ${musicId}`)
  console.log(`[AUDIOMACK] URL: ${url}`)
  console.log(`[AUDIOMACK] UserId: ${userId || "none"}`)
  
  try {
    const { makePublicRequest, makeAuthenticatedRequest } = await import("./audiomack/client")
    
    // Try public request first
    console.log(`[AUDIOMACK] Attempting public request for streaming URL`)
    const response = await makePublicRequest(url)
    
    console.log(`[AUDIOMACK] Public request response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      // If public request fails, try with OAuth (if userId provided AND credentials configured)
      if (response.status === 401 && userId) {
        console.log(`[AUDIOMACK] Public request returned 401, checking if OAuth credentials are configured...`)
        
        // Check if OAuth credentials are configured before trying
        try {
          const { testConfig } = await import("./audiomack/env")
          if (!testConfig()) {
            console.warn(`[AUDIOMACK] OAuth credentials not configured, cannot use authenticated request`)
            const errorText = await response.text()
            throw new Error(`Failed to get streaming URL: ${response.status} ${response.statusText}. This track may require authentication, but OAuth credentials are not configured.`)
          }
          
          console.log(`[AUDIOMACK] OAuth credentials configured, trying authenticated request with userId: ${userId}`)
          const oauthResponse = await makeAuthenticatedRequest(url, "POST", userId)
          if (!oauthResponse.ok) {
            const errorText = await oauthResponse.text()
            console.error(`[AUDIOMACK] Authenticated request failed: ${oauthResponse.status} ${errorText}`)
            throw new Error(`Failed to get streaming URL: ${oauthResponse.statusText}`)
          }
          const text = await oauthResponse.text()
          const streamingUrl = text.trim().replace(/^"|"$/g, "")
          console.log(`[AUDIOMACK] Successfully got streaming URL via authenticated request: ${streamingUrl.substring(0, 100)}...`)
          return streamingUrl
        } catch (oauthError: any) {
          console.error(`[AUDIOMACK] OAuth request failed:`, oauthError.message)
          throw new Error(`Failed to get streaming URL: ${response.statusText}. ${oauthError.message}`)
        }
      } else {
        const errorText = await response.text()
        console.error(`[AUDIOMACK] Public request failed: ${response.status} ${errorText}`)
        throw new Error(`Failed to get streaming URL: ${response.status} ${response.statusText}`)
      }
    }
    
    const text = await response.text()
    const streamingUrl = text.trim().replace(/^"|"$/g, "")
    console.log(`[AUDIOMACK] Successfully got streaming URL via public request: ${streamingUrl.substring(0, 100)}...`)
    return streamingUrl
  } catch (error: any) {
    console.error(`[AUDIOMACK] Error getting streaming URL:`, error.message)
    throw new Error(`Audiomack streaming URL error: ${error.message}`)
  }
}

// Download audio from Audiomack
export async function downloadAudiomackAudio(url: string, userId?: string): Promise<{ buffer: Buffer; title: string; artist: string; coverArt?: string }> {
  console.log(`[AUDIOMACK] Starting download for URL: ${url}`)
  console.log(`[AUDIOMACK] UserId: ${userId || "none"}`)
  
  try {
    // Parse URL
    const parsed = parseAudiomackUrl(url)
    if (!parsed) {
      console.error(`[AUDIOMACK] Invalid URL format: ${url}`)
      throw new Error("Invalid Audiomack URL format")
    }
    
    const { artistSlug, trackSlug, type } = parsed
    console.log(`[AUDIOMACK] Parsed URL - Artist: ${artistSlug}, Track: ${trackSlug}, Type: ${type}`)
    
    // Get track info
    console.log(`[AUDIOMACK] Fetching track info...`)
    const trackInfo = await getAudiomackTrackInfo(artistSlug, trackSlug, type, userId)
    
    if (!trackInfo) {
      console.error(`[AUDIOMACK] Track info is null or undefined`)
      throw new Error("Track not found")
    }
    
    console.log(`[AUDIOMACK] Track info received - ID: ${trackInfo.id}, Title: ${trackInfo.title}`)
    
    // Extract metadata
    const title = trackInfo.title || "Unknown Track"
    const artist = trackInfo.artist || trackInfo.uploader?.name || "Unknown Artist"
    const coverArt = trackInfo.image || trackInfo.uploader?.image
    
    console.log(`[AUDIOMACK] Extracted metadata - Title: ${title}, Artist: ${artist}`)
    console.log(`[AUDIOMACK] Cover art URL: ${coverArt || "none"}`)
    
    // Get streaming URL (it's already in the track info, but expires quickly)
    // We can use the streaming_url from trackInfo if available, otherwise request it
    let streamingUrl = trackInfo.streaming_url
    const timeout = trackInfo.streaming_url_timeout
    
    console.log(`[AUDIOMACK] Streaming URL from track info: ${streamingUrl ? streamingUrl.substring(0, 100) + "..." : "none"}`)
    console.log(`[AUDIOMACK] Streaming URL timeout: ${timeout ? new Date(timeout * 1000).toISOString() : "none"}`)
    
    // If streaming URL is expired or not available, request a new one
    if (!streamingUrl || (timeout && timeout < Date.now() / 1000)) {
      console.log(`[AUDIOMACK] Streaming URL expired or missing, requesting new one...`)
      streamingUrl = await getAudiomackStreamingUrl(trackInfo.id, userId)
    }
    
    if (!streamingUrl) {
      console.error(`[AUDIOMACK] Could not obtain streaming URL`)
      throw new Error("Could not obtain streaming URL")
    }
    
    console.log(`[AUDIOMACK] Final streaming URL: ${streamingUrl.substring(0, 100)}...`)
    
    // Download the audio file immediately (streaming URLs expire in ~10 seconds)
    console.log(`[AUDIOMACK] Downloading audio from streaming URL...`)
    const audioResponse = await fetch(streamingUrl)
    
    console.log(`[AUDIOMACK] Audio download response: ${audioResponse.status} ${audioResponse.statusText}`)
    console.log(`[AUDIOMACK] Content-Type: ${audioResponse.headers.get("Content-Type")}`)
    console.log(`[AUDIOMACK] Content-Length: ${audioResponse.headers.get("Content-Length")}`)
    
    if (!audioResponse.ok) {
      const errorText = await audioResponse.text()
      console.error(`[AUDIOMACK] Failed to download audio: ${audioResponse.status} ${errorText}`)
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`)
    }
    
    const arrayBuffer = await audioResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`[AUDIOMACK] Audio downloaded successfully - Size: ${buffer.length} bytes`)
    
    return { buffer, title, artist, coverArt }
  } catch (error: any) {
    console.error(`[AUDIOMACK] Error downloading audio:`, error.message)
    console.error(`[AUDIOMACK] Error stack:`, error.stack)
    throw error
  }
}

