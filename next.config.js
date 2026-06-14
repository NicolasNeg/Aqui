/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA-friendly headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'camera=(self), gyroscope=(self), accelerometer=(self)' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
