import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "*.public.storage",
      },
    ],
  },
  // instrumentationHook removed - available by default in Next.js 16
};

// Sentry temporarily disabled — install @sentry/nextjs to re-enable
// const sentryConfig = withSentryConfig(nextConfig, {
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   silent: false,
// });

export default nextConfig;
