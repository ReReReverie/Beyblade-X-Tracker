import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    localPatterns: [{ pathname: "/uploads/**" }]
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/combos",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=86400"
          }
        ]
      }
    ];
  }
};

export default nextConfig;

