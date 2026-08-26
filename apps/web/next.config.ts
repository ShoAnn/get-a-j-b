import type { NextConfig } from "next";
import { loadRootEnv } from "./src/lib/rootEnv";

loadRootEnv();

const nextConfig: NextConfig = {
  async rewrites() {
    return [];
  },
};

export default nextConfig;
