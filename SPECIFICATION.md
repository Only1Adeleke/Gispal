# Gispal - Full System Specification

This document is the **source of truth** for all Gispal development.

## Core Features

- Mix jingles into MP3s (overlay, not concatenate)
- Convert audio from YouTube or Audiomack URLs
- Edit metadata (title, artist, album, cover art)
- Change volume of jingles or MP3
- Replace album cover art
- Export final processed MP3
- WordPress plugin integration

## Plan Tiers

### FREE PLAN

**Features:**
- 10-minute temporary storage
- 1 uploaded jingle
- 1 custom cover art
- Edit metadata
- Replace cover art
- Upload MP3
- Upload via MP3 URL
- Convert from YouTube/Audiomack URL → MP3
- Mix preview only (30 seconds)

**Restrictions:**
- ❌ No full export
- ❌ No 3-jingle mixing
- ❌ No jingle position selection (only "start" allowed)
- ❌ No jingle volume control
- ❌ No final cover embedding
- ❌ Cannot save final file permanently
- ❌ Cannot use extracted cover art

### PRO PLAN (Daily/Weekly/Monthly)

**Features:**
- Full export
- Permanent storage
- Mix up to 3 jingles (start, middle, end)
- Choose position
- Volume control
- Unlimited metadata editing
- Unlimited conversions from YouTube/Audiomack
- Unlimited custom cover arts
- Choose cover art from 3 sources:
  1. "My Custom Cover Arts" (dashboard uploads)
  2. "Cover Extracted from YouTube/Audiomack"
  3. "Upload from WordPress Media" (plugin sends file to API)

## Storage Logic

**FREE users:**
- Mixed file stored for **10 minutes** only (auto delete)
- Max 1 jingle upload
- Max 1 custom cover art upload
- Output is preview-only (30 seconds)
- Cannot save/export full file
- Cannot store results permanently
- Cannot fetch or use cover extracted from YouTube/Audiomack

**PRO users:**
- Unlimited jingles (up to 3 per mix)
- Up to 3 positions (start, middle, end)
- Full export
- Permanent file storage
- Multiple custom cover arts
- Use extracted cover art from Audiomack/YouTube
- Upload new cover art from WordPress Media via plugin

## API Endpoints

### Mixing
- `POST /api/mix`
  - Input: `audioSource`, `jingles[]`, `position(s)`, `volume(s)`, `coverArtId`, `previewOnly`
  - Enforces plan restrictions

### WordPress Plugin
- `POST /api/wp/mix?api_key=`
- `POST /api/wp/upload-cover?api_key=`
- `POST /api/wp/export?api_key=`

## Implementation Rules

1. Mixing uses ffmpeg-static or fluent-ffmpeg
2. Temporary files auto-delete after 10 minutes
3. Preview must be 30 seconds max
4. Only PRO users can use extracted cover art
5. Only PRO users can create full-length exports
6. WordPress plugin file uploads go to temporary bucket unless user is PRO

