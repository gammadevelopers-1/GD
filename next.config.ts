import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    useTypeScriptCli: false,
  },
};

export default nextConfig;
