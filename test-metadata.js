const NodeID3 = require('node-id3');
const fs = require('fs');
const path = require('path');

// Test reading tags from a final MP3 file
const testFile = process.argv[2] || path.join(__dirname, 'uploads', 'final-16cb9ef1-0a4a-4199-b14b-ce75791792e9.mp3');

console.log('Testing file:', testFile);

if (!fs.existsSync(testFile)) {
  console.log('File not found:', testFile);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(testFile);
const tags = NodeID3.read(fileBuffer);

console.log('\n========== ID3 TAGS ==========');
console.log('Title:', tags.title || 'MISSING');
console.log('Artist:', tags.artist || 'MISSING');
console.log('Album:', tags.album || 'MISSING');
console.log('Year:', tags.year || 'MISSING');
console.log('Genre:', tags.genre || 'MISSING');

console.log('\n========== IMAGE TAG ==========');
if (tags.image) {
  console.log('✅ IMAGE TAG EXISTS');
  if (typeof tags.image === 'object' && tags.image !== null) {
    console.log('Mime type:', tags.image.mime);
    console.log('Type:', JSON.stringify(tags.image.type));
    console.log('Description:', tags.image.description);
    console.log('Image buffer size:', tags.image.imageBuffer?.length || 0, 'bytes');
    if (tags.image.imageBuffer && tags.image.imageBuffer.length > 0) {
      console.log('✅ IMAGE BUFFER IS POPULATED');
      console.log('First 4 bytes:', tags.image.imageBuffer.slice(0, 4).toString('hex'));
    } else {
      console.log('❌ IMAGE BUFFER IS EMPTY');
    }
  } else {
    console.log('Image is a string (filename):', tags.image);
  }
} else {
  console.log('❌ IMAGE TAG MISSING');
}

console.log('\n========== ALL TAGS ==========');
console.log(JSON.stringify(tags, null, 2));

