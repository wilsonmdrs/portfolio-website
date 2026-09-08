import { defineConfig } from "vitest/config";
import path from "node:path";

// Regression tests exercise the real riveBot.ts pipeline (RiveScript
// engine + the local embedding/typo-correction models), so they run in
// Node, not jsdom, and need generous timeouts for the one-time model load
// on the first test.
export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
