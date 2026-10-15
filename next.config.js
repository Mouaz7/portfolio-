// Next.js loads this configuration as CommonJS.
/* eslint-disable @typescript-eslint/no-require-imports */
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const { createHash } = require("node:crypto");
const {
  browserExtensionCompatibilityScript,
  performanceTierInitScript,
  themeInitScript,
} = require("./lib/security/inline-scripts.cjs");

const STATIC_ASSET_DIRECTORIES = [
  "brand",
  "contact",
  "home",
  "journey",
  "project-icons",
  "skill-icons",
];

function cspHash(source) {
  return `'sha256-${createHash("sha256").update(source).digest("base64")}'`;
}

function staticCspCandidate() {
  const isDevelopment = process.env.NODE_ENV === "development";
  let supabaseOrigin = "";
  try {
    supabaseOrigin = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    ).origin;
  } catch {}

  return [
    "default-src 'self'",
    `script-src 'self' ${[
      themeInitScript,
      browserExtensionCompatibilityScript,
      performanceTierInitScript,
    ].map(cspHash).join(" ")} https://challenges.cloudflare.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseOrigin.replace(/^https:/, "wss:")}` : ""}`,
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig = (phase) => ({
  // Next.js writes dev and production bundles into the same directory by
  // default. Keep them isolated so a running dev server cannot corrupt a
  // production build used by Playwright or Lighthouse.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // Browser extensions can reject promises in their isolated scripts. Keep
  // those third-party console messages in DevTools instead of forwarding them
  // into the Next.js terminal alongside application and server logs.
  logging: {
    browserToTerminal: false,
  },
  // Hash-based SRI remains opt-in until the exact pinned Next.js/webpack build
  // has passed local, cross-browser and deployed-preview verification.
  experimental: {
    // Use the installed TypeScript compiler API directly. The CLI path emits a
    // truncated `tsc --showConfig` payload in constrained build environments.
    useTypeScriptCli: false,
    ...(process.env.NEXT_EXPERIMENTAL_SRI === "1"
      ? { sri: { algorithm: "sha256" } }
      : {}),
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
          ...(process.env.CSP_STATIC_REPORT_ONLY === "1"
            ? [{
              key: "Content-Security-Policy-Report-Only",
              value: staticCspCandidate(),
            }]
            : []),
        ],
      },
      ...(phase === PHASE_DEVELOPMENT_SERVER
        ? []
        : STATIC_ASSET_DIRECTORIES.map((directory) => ({
            source: `/${directory}/:path*`,
            headers: [{ key: "Cache-Control", value: "public, max-age=300, must-revalidate" }],
          }))),
    ];
  },
});

module.exports = nextConfig;
