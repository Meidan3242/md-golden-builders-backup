import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are shrunk on the phone first; PDFs up to ~4 MB (Vercel's request limit is 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // Not for search engines until launch (robots.txt says the same).
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
