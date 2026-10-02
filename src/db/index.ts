// Database client. One connection pool per process, built from DATABASE_URL.
// drizzle(client) with a postgres-js client: node_modules/drizzle-orm/postgres-js/driver.d.ts.
// postgres(url): node_modules/postgres/types/index.d.ts.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// Under Vitest (it sets VITEST=true: vitest.dev/guide/environment) the client refuses any
// database whose name does not end in _test, so no test can reach a development database even
// without src/db/test-db.ts.
if (process.env.VITEST && !new URL(url).pathname.endsWith("_test")) {
  throw new Error(`Tests only run against a database named *_test, not ${new URL(url).pathname.slice(1)} (vitest.config.mts derives it).`);
}

const client = postgres(url);
export const db = drizzle(client, { schema });
