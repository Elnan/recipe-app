import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Browsers request /favicon.ico by default; serve our PNG without duplicating the file
      { source: "/favicon.ico", destination: "/favicon.png" },
    ];
  },
};

export default nextConfig;
