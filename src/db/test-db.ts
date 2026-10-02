// Shared by the database tests. DATABASE_URL is already the "<database>_test" url
// (vitest.config.mts); this creates that database from DATABASE_ADMIN_URL when it is missing and
// refuses anything that is not a local test database, for both urls. postgres-js: the tagged
// template runs a parameterised query and sql.unsafe() a raw string (github.com/porsager/postgres,
// README sections "Queries" and "Unsafe raw string queries").
import postgres from "postgres";

// "postgres" and "db" are the compose and CI service names, not public hosts.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "postgres", "db"];

function localHost(url: string, what: string): URL {
  const parsed = new URL(url);
  if (!LOCAL_HOSTS.includes(parsed.hostname)) throw new Error(`Refusing to use ${parsed.hostname} as ${what}: only ${LOCAL_HOSTS.join(", ")} are allowed.`);
  return parsed;
}

export function testDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set; the database tests need a Postgres to run against.");
  const parsed = localHost(url, "the test database");
  if (!parsed.pathname.endsWith("_test")) throw new Error(`Refusing to run database tests against ${parsed.pathname.slice(1)}: the name must end in _test (vitest.config.mts derives it).`);
  return url;
}

export async function ensureTestDatabase(): Promise<string> {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  if (!adminUrl) throw new Error("DATABASE_ADMIN_URL is not set; vitest.config.mts sets it to the database the test database is created from.");
  localHost(adminUrl, "the database the test database is created from");
  const admin = postgres(adminUrl, { max: 1 });
  try {
    const exists = await admin`select 1 from pg_database where datname = ${name}`;
    if (exists.length === 0) await admin.unsafe(`create database "${name}"`);
  } finally { await admin.end(); }
  return url;
}
