const fs = require("fs").promises
const path = require("path")

const TMP_DIR = path.join(process.cwd(), "tmp", "gispal")
const MAX_AGE = 10 * 60 * 1000 // 10 minutes (per spec)

async function cleanTempFiles() {
  try {
    const files = await fs.readdir(TMP_DIR)
    const now = Date.now()

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file)
      const stats = await fs.stat(filePath)
      const age = now - stats.mtimeMs

      if (age > MAX_AGE) {
        await fs.unlink(filePath)
        console.log(`Deleted old temp file: ${file}`)
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error cleaning temp files:", error)
    }
  }
}

cleanTempFiles()

