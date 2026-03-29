/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.cinezo.net/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
