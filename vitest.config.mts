import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit / regression tests for server logic. "server-only" is a Next.js guard; in tests it's an empty module.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
