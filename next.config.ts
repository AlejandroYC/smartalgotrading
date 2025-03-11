import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name][ext]'
      }
    });
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|webp|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/images/[name][ext]'
      }
    });
    config.resolve.symlinks = false;
    return config;
  },
  distDir: '.next',
  generateBuildId: () => 'build',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
