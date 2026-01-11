import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using default SSG mode (not static export) to enable API routes
  // All pages are still statically generated
  trailingSlash: true,

  // Configure server-side external packages for proper bundling in Vercel
  serverExternalPackages: ['pdfjs-dist'],

  // Configure webpack to handle pdfjs-dist properly in Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Alias canvas to false - pdfjs-dist optionally uses canvas but we don't need it
        canvas: false,
      };
    }

    // Handle .mjs files for pdfjs-dist
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
};

export default nextConfig;
