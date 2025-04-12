/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      ...Array.from({ length: 30 }, (_, i) => 
        `basket-${String(i + 1).padStart(2, '0')}.wbbasket.ru`
      )
    ]
  }
}

module.exports = nextConfig