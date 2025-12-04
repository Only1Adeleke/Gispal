#!/usr/bin/env node

/**
 * Comprehensive test script for audio pipeline
 * Tests: file paths, node-id3, cover art embedding, file existence
 */

const fs = require("fs");
const path = require("path");
const NodeID3 = require("node-id3");

console.log("=".repeat(60));
console.log("AUDIO PIPELINE VERIFICATION TEST");
console.log("=".repeat(60));
console.log("Current working directory:", process.cwd());
console.log("");

// Test 1: Check uploads directory
console.log("TEST 1: Uploads Directory");
console.log("-".repeat(60));
const uploadsDir = path.join(process.cwd(), "uploads");
console.log("Uploads directory path:", uploadsDir);
console.log("Exists:", fs.existsSync(uploadsDir));

if (!fs.existsSync(uploadsDir)) {
  console.log("⚠️  Creating uploads directory...");
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
} else {
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith(".mp3"));
  console.log(`✅ Uploads directory exists with ${files.length} MP3 files`);
  if (files.length > 0) {
    console.log("Sample files:", files.slice(0, 3).join(", "));
  }
}
console.log("");

// Test 2: Test node-id3 write/read
console.log("TEST 2: NodeID3 Write/Read");
console.log("-".repeat(60));
const testFile = path.join(process.cwd(), "test-audio.mp3");

// Create minimal valid MP3
const mp3Data = Buffer.from([
  0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

fs.writeFileSync(testFile, mp3Data);
console.log("✅ Created test MP3 file");

// Create test JPEG buffer
const jpegBuffer = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
  0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xFF, 0xDB, 0x00, 0x43, 0x00,
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
  0xFF, 0xD9
]);

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

console.log("Writing tags with cover art...");
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
console.log("Reading tags from file...");
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
      console.log("✅ APIC frame embedded successfully!");
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

// Clean up
fs.unlinkSync(testFile);
console.log("✅ Cleaned up test file");
console.log("");

// Test 3: Check existing files in uploads
console.log("TEST 3: Existing Files in Uploads");
console.log("-".repeat(60));
if (fs.existsSync(uploadsDir)) {
  const finalFiles = fs.readdirSync(uploadsDir)
    .filter(f => f.startsWith("final-") && f.endsWith(".mp3"));
  
  console.log(`Found ${finalFiles.length} final-*.mp3 files`);
  
  if (finalFiles.length > 0) {
    const testFileName = finalFiles[0];
    const testFilePath = path.join(uploadsDir, testFileName);
    const testId = testFileName.replace("final-", "").replace(".mp3", "");
    
    console.log("Testing file:", testFileName);
    console.log("Extracted ID:", testId);
    console.log("File exists:", fs.existsSync(testFilePath));
    
    if (fs.existsSync(testFilePath)) {
      const fileStats = fs.statSync(testFilePath);
      console.log("File size:", fileStats.size, "bytes");
      
      // Try to read tags
      try {
        const fileBuffer = fs.readFileSync(testFilePath);
        const tags = NodeID3.read(fileBuffer);
        console.log("Has metadata:", !!tags.title);
        console.log("Has image:", !!tags.image);
        if (tags.image) {
          console.log("Image buffer length:", tags.image.imageBuffer?.length || 0);
        }
      } catch (error) {
        console.error("Error reading tags:", error.message);
      }
    }
  }
}
console.log("");

// Test 4: Path resolution
console.log("TEST 4: Path Resolution");
console.log("-".repeat(60));
const testId = "e19daf68-a529-4693-a5a1-5ccbe2de3b03";
const resolvedPath = path.join(process.cwd(), "uploads", `final-${testId}.mp3`);
const absolutePath = path.resolve(resolvedPath);

console.log("Test ID:", testId);
console.log("Resolved path:", resolvedPath);
console.log("Absolute path:", absolutePath);
console.log("File exists:", fs.existsSync(absolutePath));

if (fs.existsSync(absolutePath)) {
  const stats = fs.statSync(absolutePath);
  console.log("✅ File found, size:", stats.size, "bytes");
} else {
  console.log("⚠️  File not found (may not exist in database)");
}
console.log("");

console.log("=".repeat(60));
console.log("✅ ALL TESTS COMPLETED");
console.log("=".repeat(60));

