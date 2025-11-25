// Persistence layer for in-memory database
// Saves jingles, cover arts, and audios to JSON files so they persist across server restarts

import fs from "fs/promises"
import path from "path"
import type { Jingle, CoverArt, Audio } from "./db"

const DATA_DIR = path.join(process.cwd(), ".data")
const JINGLES_FILE = path.join(DATA_DIR, "jingles.json")
const COVER_ARTS_FILE = path.join(DATA_DIR, "coverarts.json")
const AUDIOS_FILE = path.join(DATA_DIR, "audios.json")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error("Failed to create data directory:", error)
  }
}

// Load jingles from disk
export async function loadJingles(): Promise<Map<string, Jingle>> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(JINGLES_FILE, "utf-8")
    const jinglesArray = JSON.parse(data)
    const jinglesMap = new Map<string, Jingle>()
    for (const jingle of jinglesArray) {
      // Convert date strings back to Date objects
      jinglesMap.set(jingle.id, {
        ...jingle,
        createdAt: new Date(jingle.createdAt),
      })
    }
    return jinglesMap
  } catch (error) {
    // File doesn't exist yet, return empty map
    return new Map()
  }
}

// Save jingles to disk
export async function saveJingles(jingles: Map<string, Jingle>): Promise<void> {
  await ensureDataDir()
  try {
    const jinglesArray = Array.from(jingles.values())
    await fs.writeFile(JINGLES_FILE, JSON.stringify(jinglesArray, null, 2))
  } catch (error) {
    console.error("Failed to save jingles:", error)
  }
}

// Load cover arts from disk
export async function loadCoverArts(): Promise<Map<string, CoverArt>> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(COVER_ARTS_FILE, "utf-8")
    const coverArtsArray = JSON.parse(data)
    const coverArtsMap = new Map<string, CoverArt>()
    for (const coverArt of coverArtsArray) {
      coverArtsMap.set(coverArt.id, {
        ...coverArt,
        createdAt: new Date(coverArt.createdAt),
      })
    }
    return coverArtsMap
  } catch (error) {
    // File doesn't exist yet, return empty map
    return new Map()
  }
}

// Save cover arts to disk
export async function saveCoverArts(coverArts: Map<string, CoverArt>): Promise<void> {
  await ensureDataDir()
  try {
    const coverArtsArray = Array.from(coverArts.values())
    await fs.writeFile(COVER_ARTS_FILE, JSON.stringify(coverArtsArray, null, 2))
  } catch (error) {
    console.error("Failed to save cover arts:", error)
  }
}

// Load audios from disk
export async function loadAudios(): Promise<Map<string, Audio>> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(AUDIOS_FILE, "utf-8")
    const audiosArray = JSON.parse(data)
    const audiosMap = new Map<string, Audio>()
    for (const audio of audiosArray) {
      audiosMap.set(audio.id, {
        ...audio,
        createdAt: new Date(audio.createdAt),
      })
    }
    return audiosMap
  } catch (error) {
    // File doesn't exist yet, return empty map
    return new Map()
  }
}

// Save audios to disk
export async function saveAudios(audios: Map<string, Audio>): Promise<void> {
  await ensureDataDir()
  try {
    const audiosArray = Array.from(audios.values())
    await fs.writeFile(AUDIOS_FILE, JSON.stringify(audiosArray, null, 2))
  } catch (error) {
    console.error("Failed to save audios:", error)
  }
}

