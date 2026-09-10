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
  // Vercel deployment. Deliberately scoped to just this small text
  // directory, not src/models (the ~88MB local ML model weights
  // semanticFallback.ts/typoCorrection.ts also read at runtime) — those
  // failures are already caught and gracefully degrade to no-op (see
  // riveBot.ts's try/catch around findSemanticMatch/correctTypos), and
  // bundling that much extra weight into every API route risks tripping
  // Vercel's per-function size limit instead.
  outputFileTracingIncludes: {
    "/api/**": ["./src/knowledgeBase/**/*"],
  },
};

export default nextConfig;
