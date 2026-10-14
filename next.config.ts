import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Not for search engines until launch (robots.txt says the same).
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
