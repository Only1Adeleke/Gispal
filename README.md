# Gispal - Audio Mixing SaaS Platform

A production-ready SaaS platform for audio mixing, jingle management, and cover art injection. Built with Next.js 14, TypeScript, TailwindCSS, and Better-Auth.

## Features

- 🔐 **Authentication**: Email/password login with JWT sessions via Better-Auth
- 🎵 **Jingle Management**: Upload, manage, and delete audio jingles
- 🖼️ **Cover Art**: Upload and set default cover art images
- 🎚️ **Audio Mixing**: Mix audio files with jingles and inject cover art using FFmpeg
- 🔑 **API Keys**: Generate and rotate API keys for WordPress plugin integration
- 💳 **Payments**: Paystack integration with multiple subscription plans
- 📦 **Storage**: Abstracted storage layer supporting Supabase, S3, or local storage
- 🌐 **WordPress Plugin API**: RESTful API endpoints for WordPress integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Authentication**: Better-Auth
- **Audio Processing**: FFmpeg (via fluent-ffmpeg)
- **Storage**: Supabase / S3-compatible / Local
- **Payments**: Paystack

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- FFmpeg installed on your system (or use ffmpeg-static)
- Database (PostgreSQL recommended for production)
- Storage provider (Supabase, S3, or local for development)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd Gispal
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gispal"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# Storage (choose one)
# Option 1: Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_BUCKET="gispal-storage"

# Option 2: S3 Compatible
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="gispal-storage"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"

# Paystack
PAYSTACK_SECRET_KEY="sk_test_your_secret_key"
PAYSTACK_PUBLIC_KEY="pk_test_your_public_key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Gispal/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Better-Auth endpoints
│   │   ├── jingles/       # Jingle management
│   │   ├── cover/         # Cover art management
│   │   ├── mix/           # Audio mixing
│   │   ├── extract/       # Audio extraction from URLs
│   │   ├── wp/            # WordPress plugin API
│   │   ├── billing/       # Payment endpoints
│   │   └── test/          # Test endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility libraries
│   ├── auth/             # Authentication & API keys
│   ├── db.ts             # Database abstraction
│   ├── storage/          # Storage abstraction
│   ├── ffmpeg/           # FFmpeg utilities
│   └── payments/         # Paystack integration
├── scripts/              # Utility scripts
│   └── clean-tmp.js      # Temp file cleanup
└── tmp/                  # Temporary files (gitignored)
```

## API Endpoints

### Authentication

- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout

### Jingles

- `POST /api/jingles/upload` - Upload a jingle
- `GET /api/jingles` - Get all user jingles
- `DELETE /api/jingles/[id]` - Delete a jingle

### Cover Art

- `POST /api/cover/upload` - Upload cover art
- `GET /api/cover` - Get all user cover arts
- `DELETE /api/cover/[id]` - Delete cover art
- `PATCH /api/cover/[id]` - Set default cover art

### Mixing

- `POST /api/mix` - Mix audio with jingle and cover art
  ```json
  {
    "audioUrl": "https://example.com/audio.mp3",
    "jingleId": "optional-jingle-id",
    "coverArtId": "optional-cover-art-id",
    "position": "start" | "middle" | "end",
    "previewOnly": false
  }
  ```

### Extraction

- `POST /api/extract` - Extract audio from YouTube/Audiomack URL
  ```json
  {
    "url": "https://youtube.com/watch?v=..."
  }
  ```

### WordPress Plugin API

- `GET /api/wp/jingles?api_key=xxx` - Get jingles
- `GET /api/wp/cover?api_key=xxx` - Get cover arts
- `POST /api/wp/mix?api_key=xxx` - Mix audio

### Billing

- `POST /api/billing/initialize` - Initialize payment
- `POST /api/billing/verify` - Verify payment

### Settings

- `GET /api/settings/api-key` - Get API key status
- `POST /api/settings/api-key` - Generate/rotate API key

### Test Endpoints

- `GET /api/health` - Health check
- `GET /api/test/ffmpeg` - Test FFmpeg functionality
- `GET /api/test/storage` - Test storage functionality

## Generating API Keys

1. Log in to your dashboard
2. Navigate to **Settings**
3. Click **Generate API Key**
4. Copy and save your API key (you won't be able to see it again)
5. Use this key in your WordPress plugin requests

## WordPress Plugin Integration

The WordPress plugin API uses API key authentication. Include your API key as a query parameter:

```bash
# Get jingles
curl "https://your-domain.com/api/wp/jingles?api_key=your_api_key"

# Mix audio
curl -X POST "https://your-domain.com/api/wp/mix?api_key=your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "jingleId": "jingle-id",
    "coverArtId": "cover-art-id",
    "position": "start"
  }'
```

## How Mixing Works

1. **Upload Audio**: Provide an MP3 URL or upload a file
2. **Select Jingle** (optional): Choose a jingle to mix with
3. **Select Cover Art** (optional): Choose cover art to inject
4. **Choose Position**: Set where the jingle should be placed (start/middle/end)
5. **Preview or Full**: Choose preview (20-30 seconds) or full mix
6. **Process**: FFmpeg merges the audio, injects cover art, and outputs the result

The system:
- Downloads audio files to temporary storage
- Uses FFmpeg to merge audio streams
- Injects cover art as MP3 metadata
- Uploads final output to permanent storage
- Tracks bandwidth usage per user

## Subscription Plans

- **Free**: 100MB bandwidth
- **Daily Unlimited**: Unlimited bandwidth, daily subscription
- **Daily 250MB**: 250MB bandwidth, daily subscription
- **Weekly Unlimited**: Unlimited bandwidth, weekly subscription
- **Weekly 300MB**: 300MB bandwidth, weekly subscription
- **Monthly Unlimited**: Unlimited bandwidth, monthly subscription
- **Monthly 5000MB**: 5000MB bandwidth, monthly subscription

## Temporary File Management

Preview files are stored in `/tmp/gispal` and automatically deleted after 30 minutes. You can manually clean temp files:

```bash
npm run clean-tmp
```

For production, set up a cron job to run this script periodically.

## Deployment to Brimble

1. **Prepare your environment**

   - Set up your database (PostgreSQL recommended)
   - Configure your storage provider (Supabase or S3)
   - Get your Paystack keys

2. **Set environment variables in Brimble**

   Add all required environment variables in your Brimble dashboard.

3. **Deploy**

   ```bash
   # Install Brimble CLI if needed
   npm install -g @brimble/cli

   # Login
   brimble login

   # Deploy
   brimble deploy
   ```

4. **Configure domain**

   - Set your custom domain in Brimble
   - Update `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to match your domain

5. **Set up cron job** (optional)

   For temp file cleanup, set up a cron job or scheduled task to run `scripts/clean-tmp.js` every 30 minutes.

## Database Setup

The current implementation uses an in-memory database for development. For production, you should:

1. Set up a PostgreSQL database
2. Replace the database abstraction in `lib/db.ts` with Prisma, Drizzle, or your preferred ORM
3. Run migrations to create the necessary tables

Example schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  api_key VARCHAR(255),
  api_key_created_at TIMESTAMP,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMP,
  bandwidth_used BIGINT DEFAULT 0,
  bandwidth_limit BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jingles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cover_arts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mixes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  audio_url TEXT NOT NULL,
  jingle_id UUID REFERENCES jingles(id),
  cover_art_id UUID REFERENCES cover_arts(id),
  position VARCHAR(20),
  output_url TEXT NOT NULL,
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Storage Configuration

### Supabase

1. Create a Supabase project
2. Create a storage bucket named `gispal-storage`
3. Set `SUPABASE_URL` and `SUPABASE_KEY` in your `.env`

### S3-Compatible

1. Set up an S3 bucket or S3-compatible service (DigitalOcean Spaces, Cloudflare R2, etc.)
2. Configure the following environment variables:
   - `S3_ENDPOINT`
   - `S3_REGION`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`

### Local (Development Only)

For local development, files are stored in `./storage`. This is not recommended for production.

## Troubleshooting

### FFmpeg not found

If you encounter FFmpeg errors:

1. Install FFmpeg on your system, or
2. The project uses `ffmpeg-static` which should work automatically

### Storage errors

- Verify your storage credentials are correct
- Check that your storage bucket exists and is accessible
- For Supabase, ensure the bucket is public or configure proper RLS policies

### Authentication issues

- Verify `BETTER_AUTH_SECRET` is set and secure
- Check that `BETTER_AUTH_URL` matches your deployment URL
- Ensure cookies are enabled in your browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub or contact support.

