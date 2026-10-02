// Shared by the database tests. DATABASE_URL is already the "<database>_test" url
// (vitest.config.mts); this creates that database from DATABASE_ADMIN_URL when it is missing and
// refuses anything that is not a local test database.
import postgres from "postgres";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "postgres", "db"];

export function testDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set; the database tests need a Postgres to run against.");
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith("_test")) throw new Error(`Refusing to run database tests against ${parsed.pathname.slice(1)}: the name must end in _test (vitest.config.mts derives it).`);
  if (!LOCAL_HOSTS.includes(parsed.hostname)) throw new Error(`Refusing to run database tests against ${parsed.hostname}: only ${LOCAL_HOSTS.join(", ")} are allowed.`);
  return url;
}

export async function ensureTestDatabase(): Promise<string> {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  if (!adminUrl) throw new Error("DATABASE_ADMIN_URL is not set; vitest.config.mts sets it to the database the test database is created from.");
  const admin = postgres(adminUrl, { max: 1 });
  try {
    const exists = await admin`select 1 from pg_database where datname = ${name}`;
    if (exists.length === 0) await admin.unsafe(`create database "${name}"`);
  } finally { await admin.end(); }
  return url;
}
