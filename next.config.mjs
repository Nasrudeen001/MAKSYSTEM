/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = config.ignoreWarnings || []
    config.ignoreWarnings.push(/Serializing big strings/)
    return config
  },
}

export default nextConfig
