// Audiomack API integration
import OAuth from "oauth-1.0a"
import crypto from "node:crypto"

const API_BASE = "https://api.audiomack.com/v1"

// Get OAuth credentials from environment variables
const getOAuthCredentials = () => {
  const consumerKey = process.env.AUDIOMACK_CONSUMER_KEY || ""
  const consumerSecret = process.env.AUDIOMACK_CONSUMER_SECRET || ""
  
  if (!consumerKey || !consumerSecret) {
    console.warn("Audiomack OAuth credentials not configured. Some features may not work.")
  }
  
  return { consumerKey, consumerSecret }
}

// Create OAuth instance
const createOAuth = () => {
  const { consumerKey, consumerSecret } = getOAuthCredentials()
  
  return new OAuth({
    consumer: {
      key: consumerKey,
      secret: consumerSecret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64")
    },
  })
}

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

// Make authenticated OAuth request
async function makeOAuthRequest(url: string, method: "GET" | "POST" = "GET", body?: any): Promise<Response> {
  const oauth = createOAuth()
  const { consumerKey, consumerSecret } = getOAuthCredentials()
  
  if (!consumerKey || !consumerSecret) {
    throw new Error("Audiomack OAuth credentials not configured")
  }
  
  const requestData = {
    url,
    method,
  }
  
  const token = {
    key: "",
    secret: "",
  }
  
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
  
  const headers: HeadersInit = {
    ...authHeader,
    "Content-Type": "application/json",
  }
  
  const options: RequestInit = {
    method,
    headers,
  }
  
  if (body && method === "POST") {
    options.body = JSON.stringify(body)
  }
  
  return fetch(url, options)
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
export async function getAudiomackTrackInfo(artistSlug: string, trackSlug: string, type: "song" | "album" = "song"): Promise<any> {
  const url = `${API_BASE}/music/${type}/${artistSlug}/${trackSlug}`
  
  try {
    // Try public request first (works for public tracks)
    const response = await makePublicRequest(url)
    
    if (!response.ok) {
      // If public request fails, try with OAuth
      if (response.status === 401) {
        const oauthResponse = await makeOAuthRequest(url, "GET")
        if (!oauthResponse.ok) {
          throw new Error(`Failed to fetch track info: ${oauthResponse.statusText}`)
        }
        return await oauthResponse.json()
      }
      throw new Error(`Failed to fetch track info: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.results || data
  } catch (error: any) {
    throw new Error(`Audiomack API error: ${error.message}`)
  }
}

// Get streaming URL for a track
export async function getAudiomackStreamingUrl(musicId: string): Promise<string> {
  const url = `${API_BASE}/music/${musicId}/play`
  
  try {
    // Try public request first
    const response = await makePublicRequest(url)
    
    if (!response.ok) {
      // If public request fails, try with OAuth
      if (response.status === 401) {
        const oauthResponse = await makeOAuthRequest(url, "POST")
        if (!oauthResponse.ok) {
          throw new Error(`Failed to get streaming URL: ${oauthResponse.statusText}`)
        }
        const text = await oauthResponse.text()
        return text.trim().replace(/^"|"$/g, "") // Remove quotes if present
      }
      throw new Error(`Failed to get streaming URL: ${response.statusText}`)
    }
    
    const text = await response.text()
    return text.trim().replace(/^"|"$/g, "") // Remove quotes if present
  } catch (error: any) {
    throw new Error(`Audiomack streaming URL error: ${error.message}`)
  }
}

// Download audio from Audiomack
export async function downloadAudiomackAudio(url: string): Promise<{ buffer: Buffer; title: string; artist: string }> {
  // Parse URL
  const parsed = parseAudiomackUrl(url)
  if (!parsed) {
    throw new Error("Invalid Audiomack URL format")
  }
  
  const { artistSlug, trackSlug, type } = parsed
  
  // Get track info
  const trackInfo = await getAudiomackTrackInfo(artistSlug, trackSlug, type)
  
  if (!trackInfo) {
    throw new Error("Track not found")
  }
  
  // Extract metadata
  const title = trackInfo.title || "Unknown Track"
  const artist = trackInfo.artist || trackInfo.uploader?.name || "Unknown Artist"
  
  // Get streaming URL (it's already in the track info, but expires quickly)
  // We can use the streaming_url from trackInfo if available, otherwise request it
  let streamingUrl = trackInfo.streaming_url
  
  // If streaming URL is expired or not available, request a new one
  if (!streamingUrl || (trackInfo.streaming_url_timeout && trackInfo.streaming_url_timeout < Date.now() / 1000)) {
    streamingUrl = await getAudiomackStreamingUrl(trackInfo.id)
  }
  
  if (!streamingUrl) {
    throw new Error("Could not obtain streaming URL")
  }
  
  // Download the audio file immediately (streaming URLs expire in ~10 seconds)
  const audioResponse = await fetch(streamingUrl)
  
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.statusText}`)
  }
  
  const arrayBuffer = await audioResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  return { buffer, title, artist }
}

