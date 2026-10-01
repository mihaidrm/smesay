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

const client = postgres(url);
export const db = drizzle(client, { schema });
