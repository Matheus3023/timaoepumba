import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, an installed PWA can keep comparing against (or being
  // served) a cached copy of sw.js on every update check — the browser or
  // an intermediate CDN never sees the new bytes, so the app silently never
  // updates for already-installed users no matter how many times we deploy.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
