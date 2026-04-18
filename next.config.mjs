import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Build-time guard: LOCAL_DEV must never be set in production builds
  async headers() {
    if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DEV === '1') {
      throw new Error('LOCAL_DEV=1 is not allowed in production builds');
    }
    return [];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
