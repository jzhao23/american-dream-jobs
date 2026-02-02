import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using default SSG mode (not static export) to enable API routes
  // All pages are still statically generated
  trailingSlash: true,

  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/legal#privacy-policy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal#terms',
        permanent: true,
      },
      {
        source: '/career-compass',
        destination: '/compass',
        permanent: true,
      },
      {
        source: '/careers',
        destination: '/',
        permanent: true,
      },
      {
        source: '/explore',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Configure server-side external packages for proper bundling in Vercel
  // pdf-parse needs to be external to avoid bundling issues with its test file
  serverExternalPackages: ['pdf-parse'],

  // Configure webpack to handle pdf-parse properly in Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
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
