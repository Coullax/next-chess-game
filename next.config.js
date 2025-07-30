/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // assetPrefix: './', // Ensures relative paths work
  images: {
    unoptimized: true, // Disable image optimization if using static export
  },
}

module.exports = nextConfig