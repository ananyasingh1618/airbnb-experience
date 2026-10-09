import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
