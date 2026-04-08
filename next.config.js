/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['mapbox-gl'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
}
module.exports = nextConfig
