#!/usr/bin/env node

/**
 * Verification script to test cover art embedding in MP3 files
 * Usage: node scripts/verify-cover-art.js <path-to-mp3-file>
 */

const fs = require("fs");
const path = require("path");
const NodeID3 = require("node-id3");

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error("❌ Error: Please provide a file path");
  console.log("Usage: node scripts/verify-cover-art.js <path-to-mp3-file>");
  process.exit(1);
}

// Resolve absolute path
const absolutePath = path.resolve(filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Error: File not found: ${absolutePath}`);
  process.exit(1);
}

console.log("=".repeat(60));
console.log("COVER ART VERIFICATION");
console.log("=".repeat(60));
console.log(`File: ${absolutePath}\n`);

try {
  // Read file
  const fileBuffer = fs.readFileSync(absolutePath);
  console.log(`File size: ${fileBuffer.length} bytes\n`);

  // Read ID3 tags
  const tags = NodeID3.read(fileBuffer);

  console.log("=".repeat(60));
  console.log("METADATA");
  console.log("=".repeat(60));
  console.log(`Title: ${tags.title || "MISSING"}`);
  console.log(`Artist: ${tags.artist || "MISSING"}`);
  console.log(`Album: ${tags.album || "MISSING"}`);
  console.log(`Year: ${tags.year || "MISSING"}`);
  console.log(`Genre: ${tags.genre || "MISSING"}\n`);

  console.log("=".repeat(60));
  console.log("COVER ART (APIC FRAME)");
  console.log("=".repeat(60));

  if (tags.image) {
    console.log("✅ HasImage: true");

    if (typeof tags.image === "string") {
      console.log("⚠️  Image is a string (filename reference):", tags.image);
      console.log("❌ This is NOT an embedded image!");
      process.exit(1);
    } else if (typeof tags.image === "object" && tags.image !== null) {
      console.log("✅ Image is an embedded object");
      console.log(`   Mime type: ${tags.image.mime || "MISSING"}`);
      console.log(`   Type ID: ${tags.image.type?.id || "MISSING"}`);
      console.log(`   Type name: ${tags.image.type?.name || "MISSING"}`);
      console.log(`   Description: ${tags.image.description || "MISSING"}`);

      const imageBufferLength = tags.image.imageBuffer?.length || 0;
      console.log(`   Image buffer length: ${imageBufferLength} bytes`);

      if (imageBufferLength > 0) {
        console.log("✅ APIC length: > 0");
        console.log("✅ Image buffer is populated!");
        
        // Validate magic bytes
        const buffer = tags.image.imageBuffer;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        
        if (isPNG) {
          console.log("✅ Image format: PNG");
        } else if (isJPEG) {
          console.log("✅ Image format: JPEG");
        } else {
          console.log("⚠️  Image format: Unknown (may not be valid PNG/JPEG)");
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ VERIFICATION PASSED");
        console.log("=".repeat(60));
        console.log("Cover art is properly embedded in the MP3 file!");
        process.exit(0);
      } else {
        console.error("❌ APIC length: 0");
        console.error("❌ Image buffer is empty!");
        process.exit(1);
      }
    } else {
      console.error("❌ Image is not a valid object!");
      process.exit(1);
    }
  } else {
    console.error("❌ HasImage: false");
    console.error("❌ APIC/IMAGE TAG MISSING IN FILE");
    console.error("❌ Cover art was NOT embedded!");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Error reading tags:", error.message);
  console.error(error.stack);
  process.exit(1);
}

