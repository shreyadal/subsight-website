import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // pdf-parse reads test fixtures at import-time; keep it out of the webpack bundle
  // so it runs as a native Node.js require() inside API route handlers only.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
