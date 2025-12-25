import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using default SSG mode (not static export) to enable API routes
  // All pages are still statically generated
  trailingSlash: true,
};

export default nextConfig;
