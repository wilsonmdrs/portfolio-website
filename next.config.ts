import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.alias["@public"] = path.resolve(__dirname, "public");
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@/*": "./src/*",
    },
  },
};

export default nextConfig;
