import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    useTypeScriptCli: false,
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
