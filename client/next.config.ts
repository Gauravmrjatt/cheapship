import type { NextConfig } from "next";

const nextConfig : NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

module.exports = nextConfig;

export default nextConfig;
