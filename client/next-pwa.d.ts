declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    scope?: string;
    sw?: string;
    disable?: boolean;
    skipWaiting?: boolean;
    reload?: boolean;
    cacheOnFrontend?: boolean;
    cacheOnFrontendHTML?: boolean;
    cacheOnFrontendJS?: boolean;
    cacheOnFrontendCSS?: boolean;
    buildExcludes?: string[];
    runtimeCaching?: Array<{
      urlPattern: string | RegExp;
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        cacheableResponse?: {
          statuses?: number[];
        };
        networkTimeoutSeconds?: number;
        [key: string]: unknown;
      };
    }>;
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}