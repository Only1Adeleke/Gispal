# Gispal - Audio Mixing Platform Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend API Structure](#backend-api-structure)
5. [User Dashboard](#user-dashboard)
6. [Admin Dashboard](#admin-dashboard)
7. [Key Features & Data Flow](#key-features--data-flow)
8. [Components Library](#components-library)
9. [Styling & Design System](#styling--design-system)

---

## Overview

**Gispal** is a Next.js-based audio mixing platform that allows users to:
- Upload or import audio files (MP3, YouTube, Audiomack)
- Mix audio with jingles (positioned at start, middle, end, or both)
- Edit metadata (title, artist, album, producer, year, tags)
- Add cover art (original, default, or custom)
- Manage audio library with preview and download
- Track usage and billing

**Tech Stack:**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: Radix UI (Shadcn)
- **Backend**: Next.js API Routes, Node.js
- **Audio Processing**: FFmpeg, node-id3
- **Database**: SQLite (in-memory with JSON persistence)
- **Authentication**: Better Auth
- **Storage**: Local file system (`/uploads`, `/storage`, `/tmp`)

---

## Architecture

### High-Level Flow

```
User Action → Frontend Component → API Route → Business Logic → Database/File System → Response
```

### Directory Structure

```
Gispal/
├── app/                    # Next.js App Router
│   ├── dashboard/         # User dashboard pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes (backend)
│   ├── login/             # Auth pages
│   └── register/
├── components/            # React components
│   ├── ui/                # Base UI components (Shadcn)
│   ├── audio/             # Audio-specific components
│   ├── dashboard/         # Dashboard components
│   └── admin/             # Admin components
├── lib/                   # Business logic & utilities
│   ├── auth.ts            # Authentication
│   ├── db.ts              # Database operations
│   ├── ffmpeg/            # Audio processing
│   └── storage/           # File storage
└── storage/               # File storage directories
```

---

## Frontend Structure

### User Dashboard Pages (`/app/dashboard/`)

#### 1. **Dashboard Home** (`/dashboard`)
- **Route**: `/dashboard`
- **File**: `app/dashboard/page.tsx`
- **Purpose**: Overview page showing stats, quick actions, and plan information
- **Features**:
  - Usage statistics (mixes, uploads, bandwidth)
  - Plan information and upgrade prompts
  - Quick action cards (Upload, Library, Mixer)
  - Recent activity

#### 2. **Library** (`/dashboard/library`)
- **Route**: `/dashboard/library`
- **File**: `app/dashboard/library/page.tsx`
- **Purpose**: View and manage all uploaded/mixed audio files
- **Features**:
  - Table view of all audio files
  - Play button for preview
  - Download option
  - Metadata display (title, artist, album, duration)
  - "Mixed" badge for processed files
  - Regenerate option (re-process with new settings)

#### 3. **Upload** (`/dashboard/upload`)
- **Route**: `/dashboard/upload`
- **File**: `app/dashboard/upload/page.tsx`
- **Purpose**: Upload MP3 files from local device
- **Flow**:
  1. User selects/drops MP3 file
  2. File is staged via `/api/audio/stage`
  3. `ProcessingDialog` opens with extracted metadata
  4. User configures metadata, cover art, jingle settings
  5. Clicks "Process & Generate Final Audio"
  6. Calls `/api/audio/process` to finalize
  7. File appears in library

#### 4. **External Audio** (`/dashboard/upload-external`)
- **Route**: `/dashboard/upload-external`
- **File**: `app/dashboard/upload-external/page.tsx`
- **Purpose**: Import audio from URLs (MP3, YouTube, Audiomack)
- **Flow**:
  1. User enters URL
  2. File is downloaded and staged via `/api/audio/stage-url`
  3. Same processing flow as upload

#### 5. **Jingles** (`/dashboard/jingles`)
- **Route**: `/dashboard/jingles`
- **File**: `app/dashboard/jingles/page.tsx`
- **Purpose**: Manage jingle library
- **Features**:
  - Upload jingles (MP3 files)
  - Set default jingle
  - Preview and download jingles
  - Delete jingles
  - Plan-based limits (free: 1, pro: 3)

#### 6. **Cover Art** (`/dashboard/coverart`)
- **Route**: `/dashboard/coverart`
- **File**: `app/dashboard/coverart/page.tsx`
- **Purpose**: Manage cover art library
- **Features**:
  - Upload cover art images (PNG/JPG)
  - Set default cover art
  - Preview and delete cover art
  - Used during audio processing

#### 7. **Mixer** (`/dashboard/mixer`)
- **Route**: `/dashboard/mixer`
- **File**: `app/dashboard/mixer/page.tsx`
- **Purpose**: Mix existing audio files with jingles
- **Features**:
  - Select audio from library
  - Select jingle
  - Choose position (start/middle/end/start-end)
  - Adjust volume
  - Generate mixed audio

#### 8. **Mix Audio** (`/dashboard/mix/[id]`)
- **Route**: `/dashboard/mix/:id`
- **File**: `app/dashboard/mix/[id]/page.tsx`
- **Purpose**: Mix a specific audio file by ID
- **Features**: Similar to mixer but for a specific audio file

#### 9. **Billing** (`/dashboard/billing`)
- **Route**: `/dashboard/billing`
- **File**: `app/dashboard/billing/page.tsx`
- **Purpose**: Manage subscription, API keys, and view usage
- **Tabs**:
  - **Usage**: Daily/weekly/monthly statistics
  - **API Keys**: Create and manage API keys
  - **Plans**: View and upgrade plans

#### 10. **History** (`/dashboard/history`)
- **Route**: `/dashboard/history`
- **File**: `app/dashboard/history/page.tsx`
- **Purpose**: View processing history and activity

#### 11. **Settings** (`/dashboard/settings`)
- **Route**: `/dashboard/settings`
- **File**: `app/dashboard/settings/page.tsx`
- **Purpose**: User settings and preferences

#### 12. **Account** (`/dashboard/account`)
- **Route**: `/dashboard/account`
- **File**: `app/dashboard/account/page.tsx`
- **Purpose**: Account information and logout

### Admin Dashboard Pages (`/app/admin/`)

#### 1. **Admin Home** (`/admin`)
- **Route**: `/admin`
- **File**: `app/admin/page.tsx`
- **Purpose**: Admin overview with system stats

#### 2. **Users** (`/admin/users`)
- **Route**: `/admin/users`
- **File**: `app/admin/users/page.tsx`
- **Purpose**: Manage all users
- **Features**:
  - View all users
  - Ban/unban users
  - Upgrade user plans
  - Delete users

#### 3. **Files** (`/admin/files`)
- **Route**: `/admin/files`
- **File**: `app/admin/files/page.tsx`
- **Purpose**: View all uploaded files

#### 4. **Mixes** (`/admin/mixes`)
- **Route**: `/admin/mixes`
- **File**: `app/admin/mixes/page.tsx`
- **Purpose**: View all audio mixes

#### 5. **Plans** (`/admin/plans`)
- **Route**: `/admin/plans`
- **File**: `app/admin/plans/page.tsx`
- **Purpose**: Manage subscription plans

#### 6. **System** (`/admin/system`)
- **Route**: `/admin/system`
- **File**: `app/admin/system/page.tsx`
- **Purpose**: System overview and health

---

## Backend API Structure

### Authentication APIs (`/app/api/auth/`)

#### `POST /api/auth/[...auth]`
- **File**: `app/api/auth/[...auth]/route.ts`
- **Purpose**: Better Auth catch-all route (login, register, logout, etc.)
- **Uses**: Better Auth library

### Audio Processing APIs (`/app/api/audio/`)

#### `POST /api/audio/stage`
- **File**: `app/api/audio/stage/route.ts`
- **Purpose**: Stage uploaded MP3 file temporarily
- **Flow**:
  1. Receives file from FormData
  2. Saves to temp storage
  3. Extracts duration, metadata, cover art
  4. Returns staging info (stagingId, stagingUrl, duration, metadata)
- **Response**:
```json
{
  "stagingId": "uuid",
  "stagingUrl": "/api/temp/filename.mp3",
  "duration": 180,
  "extractedCoverArt": "/api/temp/cover.jpg",
  "extractedMetadata": { "title": "...", "artist": "..." }
}
```

#### `POST /api/audio/stage-url`
- **File**: `app/api/audio/stage-url/route.ts`
- **Purpose**: Stage audio from external URL (YouTube, Audiomack, MP3)
- **Flow**:
  1. Downloads audio from URL
  2. Saves to temp storage
  3. Extracts metadata and cover art
  4. Returns staging info

#### `POST /api/audio/process`
- **File**: `app/api/audio/process/route.ts`
- **Purpose**: Finalize audio processing (mixing + metadata + cover art)
- **Flow**:
  1. **Step 1**: Mix audio with jingles (if selected) → temp mixed file
  2. **Step 2**: Apply metadata and cover art using node-id3 → final file
  3. Save to database
  4. Clean up temp files
  5. Return final audio info
- **Request Body**:
```json
{
  "stagingId": "uuid",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "producer": "Producer Name",
  "year": "2024",
  "tags": "hip-hop, rap",
  "jingleId": "uuid",
  "position": "start",
  "volume": 100,
  "coverArtSource": "default"
}
```

#### `POST /api/audio/mix`
- **File**: `app/api/audio/mix/route.ts`
- **Purpose**: Mix existing audio with jingle (legacy route)
- **Flow**: Similar to process but for already-uploaded audio

#### `GET /api/audio`
- **File**: `app/api/audio/route.ts`
- **Purpose**: List all audio files for user

#### `GET /api/audio/[id]`
- **File**: `app/api/audio/[id]/route.ts`
- **Purpose**: Get specific audio file info

#### `PATCH /api/audio/[id]/metadata`
- **File**: `app/api/audio/[id]/metadata/route.ts`
- **Purpose**: Update metadata for existing audio file

### Jingles APIs (`/app/api/jingles/`)

#### `GET /api/jingles`
- **File**: `app/api/jingles/route.ts`
- **Purpose**: List all jingles for user

#### `POST /api/jingles/upload`
- **File**: `app/api/jingles/upload/route.ts`
- **Purpose**: Upload new jingle

#### `DELETE /api/jingles/[id]`
- **File**: `app/api/jingles/[id]/route.ts`
- **Purpose**: Delete jingle

### Cover Art APIs (`/app/api/cover/`)

#### `GET /api/cover`
- **File**: `app/api/cover/route.ts`
- **Purpose**: List all cover art for user

#### `POST /api/cover/upload`
- **File**: `app/api/cover/upload/route.ts`
- **Purpose**: Upload new cover art

#### `DELETE /api/cover/[id]`
- **File**: `app/api/cover/[id]/route.ts`
- **Purpose**: Delete cover art

### Admin APIs (`/app/api/admin/`)

#### `GET /api/admin/users`
- **File**: `app/api/admin/users/route.ts`
- **Purpose**: List all users (admin only)

#### `GET /api/admin/user/[id]`
- **File**: `app/api/admin/user/[id]/route.ts`
- **Purpose**: Get user details

#### `POST /api/admin/user/[id]/ban`
- **File**: `app/api/admin/user/[id]/ban/route.ts`
- **Purpose**: Ban/unban user

#### `POST /api/admin/user/[id]/upgrade`
- **File**: `app/api/admin/user/[id]/upgrade/route.ts`
- **Purpose**: Upgrade user plan

#### `DELETE /api/admin/user/[id]/delete`
- **File**: `app/api/admin/user/[id]/delete/route.ts`
- **Purpose**: Delete user

### Billing APIs (`/app/api/billing/`)

#### `POST /api/billing/initialize`
- **File**: `app/api/billing/initialize/route.ts`
- **Purpose**: Initialize payment with Paystack

#### `POST /api/billing/verify`
- **File**: `app/api/billing/verify/route.ts`
- **Purpose**: Verify payment transaction

### Storage APIs

#### `GET /api/storage/[...path]`
- **File**: `app/api/storage/[...path]/route.ts`
- **Purpose**: Serve stored files (jingles, cover art)

#### `GET /api/uploads/[...path]`
- **File**: `app/api/uploads/[...path]/route.ts`
- **Purpose**: Serve uploaded audio files

#### `GET /api/temp/[filename]`
- **File**: `app/api/temp/[filename]/route.ts`
- **Purpose**: Serve temporary files (staging, previews)

---

## User Dashboard

### Layout Structure

```
┌─────────────────────────────────────────┐
│  Sidebar (Fixed)  │  Main Content Area  │
│                   │                      │
│  - Library        │  [Page Content]     │
│  - Upload         │                      │
│  - External Audio │                      │
│  - Audio Tools    │                      │
│  - Account        │                      │
└─────────────────────────────────────────┘
```

### Sidebar Component
- **File**: `components/dashboard/sidebar.tsx`
- **Features**:
  - Navigation links
  - User info
  - Plan badge
  - Logout button

### Key User Flows

#### Flow 1: Upload & Process Audio
```
1. User goes to /dashboard/upload
2. Drops/selects MP3 file
3. File uploaded → /api/audio/stage
4. ProcessingDialog opens
5. User fills metadata, selects cover art, chooses jingle
6. Clicks "Process & Generate Final Audio"
7. POST /api/audio/process
8. Backend:
   a. Mixes audio with jingle (FFmpeg)
   b. Applies metadata + cover art (node-id3)
   c. Saves to /uploads/final-{uuid}.mp3
   d. Saves to database
9. Dialog closes, toast shows success
10. User redirected to /dashboard/library
11. New audio appears in library
```

#### Flow 2: Import from URL
```
1. User goes to /dashboard/upload-external
2. Enters URL (YouTube/Audiomack/MP3)
3. POST /api/audio/stage-url
4. Backend downloads and stages file
5. Same processing flow as Flow 1
```

#### Flow 3: Mix Existing Audio
```
1. User goes to /dashboard/mixer or /dashboard/mix/[id]
2. Selects audio from library
3. Selects jingle
4. Chooses position and volume
5. POST /api/audio/mix
6. Backend mixes audio
7. New mixed audio appears in library
```

---

## Admin Dashboard

### Layout Structure
- **File**: `app/admin/layout.tsx`
- **Sidebar**: `components/admin/admin-sidebar.tsx`
- **Features**:
  - User management
  - File management
  - System monitoring
  - Plan management

### Admin Features

#### User Management
- View all users
- Ban/unban users
- Upgrade user plans
- Delete users
- View user activity

#### System Monitoring
- Total users
- Total files
- Storage usage
- System health

---

## Key Features & Data Flow

### Audio Processing Pipeline

#### Step 1: Staging
```typescript
// Frontend: Upload file
const formData = new FormData()
formData.append("audio", file)

// API: /api/audio/stage
const response = await fetch("/api/audio/stage", {
  method: "POST",
  body: formData
})

// Returns: { stagingId, stagingUrl, duration, extractedMetadata, extractedCoverArt }
```

#### Step 2: Processing Dialog
```typescript
// Component: ProcessingDialog
<ProcessingDialog
  open={isOpen}
  stagingId={stagingId}
  stagingUrl={stagingUrl}
  duration={duration}
  extractedMetadata={metadata}
  extractedCoverArt={coverArt}
  onProcess={handleProcess}
/>

// User configures:
// - Basic Metadata (title, artist, album, producer, year, tags)
// - Cover Art (original, default, custom)
// - Jingle Settings (jingle, position, volume)
```

#### Step 3: Final Processing
```typescript
// Frontend: Submit processing
const response = await fetch("/api/audio/process", {
  method: "POST",
  body: JSON.stringify({
    stagingId,
    title,
    artist,
    album,
    jingleId,
    position: "start",
    volume: 100,
    coverArtSource: "default"
  })
})

// Backend: /api/audio/process/route.ts
// 1. Mix audio with jingle (FFmpeg) → temp file
// 2. Apply metadata + cover art (node-id3) → final file
// 3. Save to database
// 4. Clean up temp files
```

### Metadata Injection (node-id3)

```typescript
// lib/ffmpeg/index.ts or app/api/audio/process/route.ts
import NodeID3 from "node-id3"

const tags: NodeID3.Tags = {
  title: "Song Title",
  artist: "Artist Name",
  album: "Album Name",
  year: "2024",
  genre: "Hip-Hop",
  image: {
    mime: "image/jpeg",
    type: { id: 3, name: "Cover (front)" },
    description: "Cover",
    imageBuffer: coverArtBuffer
  }
}

const taggedBuffer = NodeID3.write(tags, audioBuffer)
await fs.writeFile(outputPath, taggedBuffer)
```

### Audio Mixing (FFmpeg)

```typescript
// lib/ffmpeg/index.ts
export async function mixAudio(options: MixOptions): Promise<string> {
  // Uses FFmpeg to mix audio with jingles
  // Positions: start (0s), middle (duration/2), end (duration - jingleDuration)
  // For "start-end": overlays jingle twice
  // Returns path to mixed audio file
}
```

---

## Components Library

### UI Components (`/components/ui/`)
Base components from Shadcn UI:
- `Button` - Various button styles
- `Card` - Container cards
- `Dialog` - Modal dialogs
- `Form` - Form components with validation
- `Input` - Text inputs
- `Select` - Dropdown selects
- `Slider` - Range sliders
- `Table` - Data tables
- `Tabs` - Tab navigation
- `Toast` - Toast notifications
- `Spinner` - Loading spinners
- `Badge` - Status badges

### Audio Components (`/components/audio/`)

#### `ProcessingDialog`
- **File**: `components/audio/ProcessingDialog.tsx`
- **Purpose**: Main dialog for processing audio
- **Features**:
  - 3 tabs: Basic Metadata, Cover Art, Jingle Settings
  - Audio preview with waveform
  - Form validation (Zod)
  - Loading states
  - Submit handler

#### `Player`
- **File**: `components/audio/Player.tsx`
- **Purpose**: Audio player component
- **Features**:
  - Play/pause controls
  - Volume control
  - Waveform visualization (Wavesurfer.js)
  - Progress bar

#### `PremiumPlayer`
- **File**: `components/audio/PremiumPlayer.tsx`
- **Purpose**: Enhanced audio player with cover art

#### `MetadataDialog`
- **File**: `components/audio/MetadataDialog.tsx`
- **Purpose**: Edit metadata for existing audio files

### Dashboard Components (`/components/dashboard/`)

#### `Sidebar`
- **File**: `components/dashboard/sidebar.tsx`
- **Purpose**: Main navigation sidebar
- **Features**:
  - Navigation links
  - User profile
  - Plan information

#### `UpgradeDialog`
- **File**: `components/dashboard/upgrade-dialog.tsx`
- **Purpose**: Prompt users to upgrade plan

### Admin Components (`/components/admin/`)

#### `AdminSidebar`
- **File**: `components/admin/admin-sidebar.tsx`
- **Purpose**: Admin navigation

#### `UsersTable`
- **File**: `components/admin/users-table.tsx`
- **Purpose**: Display and manage users

#### `FilesTable`
- **File**: `components/admin/files-table.tsx`
- **Purpose**: Display all files

#### `StatsCards`
- **File**: `components/admin/stats-cards.tsx`
- **Purpose**: System statistics

---

## Styling & Design System

### Tailwind CSS
- **Config**: `tailwind.config.ts`
- **Global Styles**: `app/globals.css`
- **Theme**: Dark mode support

### Design Tokens
- Colors: Primary, secondary, muted, accent
- Spacing: Consistent spacing scale
- Typography: System fonts
- Shadows: Subtle shadows for depth
- Border Radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`

### Component Patterns

#### Cards
```tsx
<Card className="rounded-2xl border-2 shadow-lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

#### Dialogs
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

#### Forms
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

---

## Authentication Flow

### Better Auth Integration
- **File**: `lib/auth.ts`
- **Provider**: Better Auth
- **Routes**: `/api/auth/[...auth]`

### Session Management
```typescript
// Server Component
const session = await auth.api.getSession({ headers })

// Client Component
const { data: session } = useSession()
```

### Protected Routes
- Middleware checks authentication
- Redirects to `/login` if not authenticated
- Admin routes check for `role: "admin"`

---

## Database Schema

### User
```typescript
{
  id: string
  email: string
  name?: string
  plan: "free" | "daily_unlimited" | "monthly_unlimited" | ...
  bandwidthUsed: number
  bandwidthLimit: number
  role: "admin" | "user"
  banned: boolean
}
```

### Audio
```typescript
{
  id: string
  title: string
  artist?: string
  album?: string
  producer?: string
  year?: string
  tags?: string
  url: string
  duration: number
  createdAt: Date
}
```

### Jingle
```typescript
{
  id: string
  userId: string
  name: string
  fileUrl: string
  fileSize: number
  duration?: number
}
```

### CoverArt
```typescript
{
  id: string
  userId: string
  fileUrl: string
  fileSize: number
  isDefault: boolean
}
```

---

## File Storage Structure

```
storage/
├── jingles/
│   └── {userId}/
│       └── {filename}.mp3
├── coverart/
│   └── {userId}/
│       └── {filename}.jpg
└── ...

uploads/
└── final-{uuid}.mp3

tmp/
└── gispal/
    ├── temp_mixed_{uuid}.mp3
    ├── temp_jingle_{timestamp}.mp3
    └── cover_default_{timestamp}.jpg
```

---

## Error Handling

### API Errors
```typescript
try {
  // Process
} catch (error: any) {
  return NextResponse.json(
    { error: error.message || "Failed" },
    { status: 500 }
  )
}
```

### Frontend Errors
```typescript
try {
  const response = await fetch("/api/audio/process", {...})
  if (!response.ok) {
    const data = await response.json()
    toast.error(data.error)
  }
} catch (error) {
  toast.error("Something went wrong")
}
```

---

## Testing Checklist

### User Dashboard
- [ ] Upload MP3 file
- [ ] Import from URL
- [ ] Process audio with metadata
- [ ] Add cover art
- [ ] Mix with jingle
- [ ] View library
- [ ] Download audio
- [ ] Edit metadata

### Admin Dashboard
- [ ] View users
- [ ] Ban/unban users
- [ ] Upgrade plans
- [ ] View files
- [ ] System stats

---

## Common Patterns

### Loading States
```tsx
const [loading, setLoading] = useState(false)

{loading ? (
  <Spinner />
) : (
  <Button onClick={handleSubmit}>Submit</Button>
)}
```

### Toast Notifications
```tsx
import { toast } from "sonner"

toast.success("Audio processed successfully")
toast.error("Failed to process audio")
```

### Form Validation
```tsx
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional()
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

---

## Next Steps for Developers

1. **Understand the flow**: Start with upload → staging → processing → library
2. **Explore components**: Check `ProcessingDialog` for the main user flow
3. **Review API routes**: Understand `/api/audio/process` for the core logic
4. **Test locally**: Upload a file and trace through the entire flow
5. **Check logs**: Server logs show detailed processing steps

---

## Next Steps for Designers

1. **Review components**: Check `/components/ui/` for available components
2. **Understand layouts**: See `/app/dashboard/layout.tsx` for structure
3. **Check dialogs**: `ProcessingDialog` is the main interaction point
4. **Review pages**: Each page in `/app/dashboard/` is a separate view
5. **Styling**: All styles use Tailwind CSS classes

---

## Support & Questions

For questions about:
- **Frontend**: Check component files in `/components/`
- **Backend**: Check API routes in `/app/api/`
- **Business Logic**: Check `/lib/` directory
- **Database**: Check `/lib/db.ts`

---

**Last Updated**: 2024
**Version**: 1.0.0

