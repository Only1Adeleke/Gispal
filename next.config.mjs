/** @type {import('next').NextConfig} */
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
  // Ensure ffmpeg/ffprobe static binaries are not bundled
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize ffmpeg-static and ffprobe-static to prevent bundling issues
      config.externals = config.externals || []
      config.externals.push({
        'ffmpeg-static': 'commonjs ffmpeg-static',
        'ffprobe-static': 'commonjs ffprobe-static',
      })
    }
    return config
  },
}

export default nextConfig

