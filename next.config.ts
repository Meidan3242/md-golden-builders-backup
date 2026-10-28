import type { NextConfig } from "next";

// Where private files are served from (signed links): Cloudflare R2, and Supabase Storage for older files.
// R2_ENDPOINT is only set for local testing against a stand-in.
const files = ["https://*.r2.cloudflarestorage.com", "https://*.supabase.co", process.env.R2_ENDPOINT ? new URL(process.env.R2_ENDPOINT).origin : ""].filter(Boolean).join(" ");

// 'unsafe-inline' scripts: Next.js streams its page data as inline scripts and the theme is set before paint.
// Everything else is locked to this site: no framing (contract signing can't be overlaid), no plugins, no other origins.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org ${files}`,
  `media-src 'self' blob: ${files}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Not for search engines until launch (robots.txt says the same).
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The estimate PDF is made on the server with its own fonts and the letterhead images.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/estimates/[id]/pdf": ["./src/pdf/fonts/*.ttf", "./public/logo-light.png", "./public/brand/*", "./public/work/*"],
    "/e/[token]/pdf": ["./src/pdf/fonts/*.ttf", "./public/logo-light.png", "./public/brand/*", "./public/work/*"],
  },
  // Photos are shrunk on the phone first; PDFs up to ~4 MB (Vercel's request limit is 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  async headers() {
    // The development server needs eval for hot reload, so the policy applies to production builds only.
    return [{ source: "/:path*", headers: process.env.NODE_ENV === "production" ? SECURITY_HEADERS : SECURITY_HEADERS.filter((h) => h.key !== "Content-Security-Policy") }];
  },
};

export default nextConfig;
