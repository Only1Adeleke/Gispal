/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: false,
    serverComponentsExternalPackages: ["better-sqlite3", "drizzle-orm", "ffmpeg-static", "ffprobe-static"],
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
  // Force Webpack (disable Turbopack)
  webpack: (config, { isServer }) => {
    // Enable layers for proper module resolution
    config.experiments = { ...config.experiments, layers: true };
    
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
