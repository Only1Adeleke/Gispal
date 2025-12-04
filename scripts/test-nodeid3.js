#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const NodeID3 = require("node-id3");

// Create a minimal valid MP3 file for testing
const testFile = path.join(process.cwd(), "test.mp3");

console.log("=".repeat(60));
console.log("NODE-ID3 TEST");
console.log("=".repeat(60));

// Create a dummy MP3 file (minimal valid MP3 header)
const mp3Header = Buffer.from([
  0xFF, 0xFB, 0x90, 0x00, // MP3 sync word + header
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

fs.writeFileSync(testFile, mp3Header);
console.log("✅ Created test.mp3 file");

// Create a minimal JPEG buffer for testing
const jpegBuffer = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
  0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, // JFIF
  0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xFF, 0xDB, 0x00, 0x43, 0x00, // DQT
  0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07,
  0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B,
  0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E,
  0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22,
  0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31,
  0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C,
  0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00,
  0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00,
  0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08,
  0xFF, 0xD9 // JPEG end
]);

console.log("✅ Created test JPEG buffer:", jpegBuffer.length, "bytes");

// Build tags with cover art
const tags = {
  title: "Test Song",
  artist: "Test Artist",
  album: "Test Album",
  year: "2024",
  image: {
    mime: "image/jpeg",
    type: {
      id: 3,
      name: "front cover"
    },
    description: "Cover",
    imageBuffer: jpegBuffer,
  }
};

console.log("\nWriting tags to file...");
const writeResult = NodeID3.write(tags, testFile);

if (writeResult) {
  console.log("✅ NodeID3.write() succeeded");
} else {
  console.error("❌ NodeID3.write() failed");
  process.exit(1);
}

// Verify file exists
if (!fs.existsSync(testFile)) {
  console.error("❌ File does not exist after write");
  process.exit(1);
}

const stats = fs.statSync(testFile);
console.log("✅ File exists, size:", stats.size, "bytes");

// Read tags back
console.log("\nReading tags from file...");
const fileBuffer = fs.readFileSync(testFile);
const readTags = NodeID3.read(fileBuffer);

console.log("Title:", readTags.title || "MISSING");
console.log("Artist:", readTags.artist || "MISSING");
console.log("Has image:", !!readTags.image);

if (readTags.image) {
  if (typeof readTags.image === "object" && readTags.image !== null) {
    const imageBufferLength = readTags.image.imageBuffer?.length || 0;
    console.log("✅ Image buffer length:", imageBufferLength, "bytes");
    
    if (imageBufferLength > 0) {
      console.log("✅ VERIFICATION PASSED - Cover art embedded successfully!");
    } else {
      console.error("❌ Image buffer is empty");
      process.exit(1);
    }
  } else {
    console.error("❌ Image is not an object");
    process.exit(1);
  }
} else {
  console.error("❌ No image tag found");
  process.exit(1);
}

console.log("\n" + "=".repeat(60));
console.log("✅ ALL TESTS PASSED");
console.log("=".repeat(60));

