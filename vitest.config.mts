// Unit tests for logic (decision 0004). defineConfig from node_modules/vitest/dist/config.d.ts.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    // The database tests (src/db) need a Postgres. Default: the docker compose one, the same
    // value as .env.example; CI sets DATABASE_URL to its service container.
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://smesay:smesay@localhost:5432/smesay",
    },
  },
});
