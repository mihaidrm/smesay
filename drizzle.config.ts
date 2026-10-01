// drizzle-kit config. Fields from node_modules/drizzle-kit/index.d.mts (dialect, schema, out,
// dbCredentials.url for postgresql).
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://smesay:smesay@localhost:5432/smesay",
  },
});
