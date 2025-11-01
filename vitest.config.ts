import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "astro:content": "/src/test-utils/astro-mocks.ts",
    },
  },
});
