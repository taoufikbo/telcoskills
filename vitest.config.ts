import path from "node:path";
import { defineConfig } from "vitest/config";

// L'alias « @/ » reprend celui de tsconfig.json (« paths »).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { include: ["src/**/*.test.ts"] },
});
