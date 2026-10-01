// Unit tests for logic (decision 0004). defineConfig from node_modules/vitest/dist/config.d.ts.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
