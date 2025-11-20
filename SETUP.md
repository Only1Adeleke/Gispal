# Quick Setup Guide

## Initial Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables
   - At minimum, set `BETTER_AUTH_SECRET` to a secure random string

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:3000
   - Register a new account
   - Start using the dashboard

## Important Notes

### Database
- The current implementation uses an in-memory database for development
- For production, you MUST replace `lib/db.ts` with a real database (Prisma, Drizzle, etc.)
- See README.md for database schema

### Better-Auth
- Better-Auth requires proper database setup for production
- The custom adapter in `lib/auth/index.ts` is for development only
- Replace with Prisma adapter or similar for production

### Storage
- For local development, files are stored in `./storage`
- Configure Supabase or S3 for production
- See README.md for storage configuration

### FFmpeg
- The project uses `ffmpeg-static` which should work automatically
- If you encounter issues, install FFmpeg system-wide

## Next Steps

1. Set up a production database
2. Configure storage provider (Supabase or S3)
3. Set up Paystack account and get API keys
4. Deploy to Brimble or your preferred hosting
5. Set up cron job for temp file cleanup

## Testing

Test the basic functionality:

1. **Health Check**: `GET /api/health`
2. **FFmpeg Test**: `GET /api/test/ffmpeg`
3. **Storage Test**: `GET /api/test/storage`

## Troubleshooting

### "FFmpeg not found"
- Install FFmpeg system-wide, or
- Ensure `ffmpeg-static` is installed (should be automatic)

### "Storage errors"
- Check your storage credentials
- Verify bucket exists and is accessible
- For Supabase, check RLS policies

### "Authentication not working"
- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your domain
- Clear browser cookies and try again

