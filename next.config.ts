import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using default SSG mode (not static export) to enable API routes
  // All pages are still statically generated
  trailingSlash: true,

  // Configure server-side external packages for proper bundling in Vercel
  // pdf-parse requires special handling as it loads test files at runtime
  serverExternalPackages: ['pdf-parse'],

  // Configure webpack to handle pdf-parse properly in Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pdf-parse from trying to load test files in production
      config.resolve.alias = {
        ...config.resolve.alias,
        // Alias canvas to false - pdf-parse optionally uses canvas but we don't need it
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
