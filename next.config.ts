import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @huggingface/transformers (semanticFallback.ts) relies on
  // onnxruntime-node's compiled native binary. Bundling that with
  // Turbopack is a known source of "works locally, breaks once deployed"
  // failures if the bundler mangles the __dirname-relative paths the
  // native loader depends on — this tells Next to leave the package
  // untouched in server bundles instead of trying to bundle it.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
