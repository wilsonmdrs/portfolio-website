import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @huggingface/transformers (semanticFallback.ts) relies on
  // onnxruntime-node's compiled native binary. Bundling that with
  // Turbopack is a known source of "works locally, breaks once deployed"
  // failures if the bundler mangles the __dirname-relative paths the
  // native loader depends on — this tells Next to leave the package
  // untouched in server bundles instead of trying to bundle it.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  // riveBot.ts reads every src/knowledgeBase/*.rive file off disk at
  // request time (fs.readdir + fs.readFile, not an import) so an edit
  // takes effect without a rebuild in dev. Next's automatic file tracing
  // can't see a dynamic directory walk like that, so without this the
  // .rive files are missing from the deployed serverless function —
  // works in `next dev`/`next start` (whole repo on disk), 500s in a real
  // Vercel deployment.
  //
  // Second entry: onnxruntime-node's native binding (required eagerly the
  // moment @huggingface/transformers is imported — not lazily on first
  // use, so the try/catch around findSemanticMatch/correctTypos in
  // riveBot.ts never gets a chance to run) dynamically loads
  // libonnxruntime.so.1 relative to its own __dirname at require() time.
  // Same file-tracing blind spot as above; confirmed via a real Vercel
  // crash: "Failed to load external module @huggingface/transformers:
  // libonnxruntime.so.1: cannot open shared object file". pnpm never
  // hoists this transitive dependency to top-level node_modules, hence
  // the .pnpm-nested glob. linux/{x64,arm64} only (Vercel's actual
  // runtime platforms) — not darwin/win32, and deliberately not
  // src/models (the ~88MB local ML model weights, loaded lazily and
  // already caught by that same try/catch if missing) — every extra
  // megabyte here risks tripping Vercel's per-function size limit
  // instead of fixing anything.
  outputFileTracingIncludes: {
    "/api/**": [
      "./src/knowledgeBase/**/*",
      "./node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/bin/napi-v6/linux/**/*",
    ],
  },
};

export default nextConfig;
