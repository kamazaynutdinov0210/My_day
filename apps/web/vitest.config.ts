import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Next.js keeps `jsx: "preserve"` in tsconfig, so tell esbuild to compile JSX for tests.
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
});
