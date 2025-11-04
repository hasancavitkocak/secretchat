/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment için optimizasyonlar
  experimental: {
    serverComponentsExternalPackages: ['socket.io']
  },
  // WebSocket için gerekli headers
  async headers() {
    return [
      {
        source: '/api/socket',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;