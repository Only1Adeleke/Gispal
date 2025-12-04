/** @type {import('next').NextConfig} */
// Diagnostics: Show yt-dlp binary location
import path from "path"
import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const binPath = path.resolve(process.cwd(), "bin", "yt-dlp")
console.log("YT-DLP BINARY LOCATION:", binPath)

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Serve static files from /uploads directory
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
  // Ensure server-only packages are not bundled for client
  serverComponentsExternalPackages: [
    'better-sqlite3',
    'drizzle-orm',
    'ffmpeg-static',
    'ffprobe-static',
  ],
  // Ensure ffmpeg/ffprobe static binaries are not bundled
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize server-only packages to prevent bundling issues
      config.externals = config.externals || []
      config.externals.push({
        'ffmpeg-static': 'commonjs ffmpeg-static',
        'ffprobe-static': 'commonjs ffprobe-static',
        'better-sqlite3': 'commonjs better-sqlite3',
      })
    }
    return config
  },
}

export default nextConfig
