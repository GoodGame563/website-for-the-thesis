/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      ...Array.from({ length: 30 }, (_, i) => 
        `basket-${String(i + 1).padStart(2, '0')}.wbbasket.ru`
      )
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
}

module.exports = nextConfig