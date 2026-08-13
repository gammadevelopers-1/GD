import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable this CLI so Node 26 does not corrupt its output.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
