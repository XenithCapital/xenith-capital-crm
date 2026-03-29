/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib'],
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
