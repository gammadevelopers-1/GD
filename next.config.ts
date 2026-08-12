import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node 26 currently corrupts captured `tsc --showConfig` output in Next's
  // detached CLI worker. The compiler API performs the same build check.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
