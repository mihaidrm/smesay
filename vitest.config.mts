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
      // better-auth needs a secret and a base url to run; this value is for the tests only and
      // is no secret. Mail goes to the memory outbox (src/lib/mail.ts).
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "vitest-only-secret-not-used-anywhere-else",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      MAIL_SMTP_URL: "memory:",
      EMAIL_FROM: "SMEsay <sign-in@localhost>",
      // Objects go to the memory store (src/lib/storage.ts); the other S3 values are unused then.
      S3_ENDPOINT: "memory:",
      S3_BUCKET: "uploads",
      S3_ACCESS_KEY_ID: "unused",
      S3_SECRET_ACCESS_KEY: "unused",
    },
  },
});
