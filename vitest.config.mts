// Unit tests for logic (decision 0004). defineConfig from node_modules/vitest/dist/config.d.ts.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests run against "<database>_test" on the server DATABASE_URL names, never the database
// itself (stories/E1-2, E1-3): the test database is created from DATABASE_ADMIN_URL when missing.
// Database test files run one at a time (fileParallelism: vitest.dev/config/fileparallelism),
// because src/db/schema.test.ts drops and recreates the schema the other files use.
const given = process.env.DATABASE_URL ?? "postgres://smesay:smesay@localhost:5432/smesay";
const testUrl = new URL(given);
testUrl.pathname = testUrl.pathname.replace(/\/?$/, "") + "_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    fileParallelism: false,
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    env: {
      DATABASE_URL: testUrl.toString(),
      DATABASE_ADMIN_URL: given,
    },
  },
});
