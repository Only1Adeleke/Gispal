/**
 * Test script for YouTube download functionality
 */

const { downloadYouTubeAudio, isValidYouTubeUrl } = require("../lib/youtube/downloader")

async function test() {
  const testUrl = "https://www.youtube.com/watch?v=yXcPNBUruuo"
  
  console.log("Testing YouTube download...")
  console.log("URL:", testUrl)
  console.log("Valid:", isValidYouTubeUrl(testUrl))
  
  try {
    console.log("\nStarting download...")
    const result = await downloadYouTubeAudio(testUrl)
    
    console.log("\n✅ Download successful!")
    console.log("Title:", result.title)
    console.log("Artist:", result.artist)
    console.log("Duration:", result.duration, "seconds")
    console.log("Buffer size:", result.buffer.length, "bytes")
    console.log("Thumbnail:", result.thumbnail)
    
    return true
  } catch (error) {
    console.error("\n❌ Download failed:", error.message)
    console.error(error.stack)
    return false
  }
}

test().then(success => {
  process.exit(success ? 0 : 1)
})

