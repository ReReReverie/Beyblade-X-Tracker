import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    localPatterns: [{ pathname: "/uploads/**" }]
  }
};

export default nextConfig;
