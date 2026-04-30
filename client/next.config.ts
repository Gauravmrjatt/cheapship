import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

const moduleExports = nextConfig;

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
const SENTRY_URL = process.env.SENTRY_URL;

const sentryWebpackPluginOptions = {
  silent: true,
  org: SENTRY_ORG,
  project: SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  ...(SENTRY_AUTH_TOKEN && { authToken: SENTRY_AUTH_TOKEN }),
  ...(SENTRY_URL && { sentryUrl: SENTRY_URL }),
};

export default withSentryConfig(moduleExports, sentryWebpackPluginOptions);