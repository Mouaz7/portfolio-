// Next.js loads this configuration as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const nextConfig = (phase) => ({
  // Next.js 15 writes dev and production bundles into the same directory by
  // default. Keep them isolated so a running dev server cannot corrupt a
  // production build used by Playwright or Lighthouse.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    // The site uses compact Tailwind/CSS-module bundles. Shipping those styles
    // with the initial HTML removes the stylesheet request waterfall and keeps
    // the fixed canvas and viewport shell in their final geometry from the
    // first paint.
    inlineCss: true,
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
  ],
  images: {
    remotePatterns: (() => {
      try {
        const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
        return [{ protocol: "https", hostname: url.hostname, port: url.port, pathname: "/**" }];
      } catch {
        return [];
      }
    })(),
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Origin-Agent-Cluster",
            value: "?1",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
    ];
  },
});

module.exports = nextConfig;
