/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      ...Array.from({ length: 21 }, (_, i) => ({
        protocol: 'https',
        hostname: `basket-${(i+1).toString().padStart(2, '0')}.wbbasket.ru`,
        pathname: '/**',
      })),
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true
}

module.exports = nextConfig