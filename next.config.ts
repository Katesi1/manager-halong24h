import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Whitelisted remote image hosts. KHÔNG dùng wildcard `**`
    // (open-redirect / image-proxy abuse risk).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.vietqr.io" },
      { protocol: "https", hostname: "halong24h.com" },
      { protocol: "https", hostname: "*.halong24h.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // CSP shipped in Report-Only mode for telemetry. Enforcing CSP requires
  // per-request nonce wiring through middleware/script tags; deferred to a
  // future sprint to avoid breaking inline scripts (GSI, next/script). The
  // Report-Only header lets the browser console.warn violations without blocking.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://img.vietqr.io https://halong24h.com https://*.halong24h.com",
              "font-src 'self' data:",
              "connect-src 'self' https://accounts.google.com https://*.halong24h.com",
              "frame-src https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
