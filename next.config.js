/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mongoose'],
  },
  api: {
    bodyParser: false,
  },
}

module.exports = nextConfig
