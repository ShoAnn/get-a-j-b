import type { NextConfig } from "next";
import { loadRootEnv } from "./src/lib/rootEnv";

// Local dev convenience: load repo-root .env. In Docker prod, env comes
// from the orchestrator and real env vars already take precedence.
if (process.env.NODE_ENV !== "production") {
  loadRootEnv();
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
