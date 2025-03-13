/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async rewrites() {
    return [
      {
        source: '/api/mt5/:path*',
        destination: 'https://18.225.209.243.nip.io/:path*',
      },
      {
        source: '/api/mt/:path*',
        destination: 'https://18.225.209.243.nip.io/:path*',
      },
    ];
  },
};

export default nextConfig; 