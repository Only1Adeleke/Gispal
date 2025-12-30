/**
 * Test database initialization
 */

const { execSync } = require("child_process")

console.log("Testing database initialization...")

try {
  // Import the database module which should trigger init
  execSync("node -e \"require('./lib/db/index'); setTimeout(() => process.exit(0), 2000)\"", {
    stdio: "inherit",
    cwd: process.cwd(),
  })
} catch (error) {
  console.error("Error:", error.message)
}

