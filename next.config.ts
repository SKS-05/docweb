import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Turn on transpilation for next-mdx-remote to ensure it uses the same React version
  transpilePackages: ["next-mdx-remote"],
};

export default nextConfig; 