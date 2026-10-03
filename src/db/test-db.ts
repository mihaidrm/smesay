// Shared by the database tests. DATABASE_URL is already the "<database>_test" url
// (vitest.config.mts); this creates that database from DATABASE_ADMIN_URL when it is missing and
// refuses anything that is not a local test database, for both urls. postgres-js: the tagged
// template runs a parameterised query and sql.unsafe() a raw string (github.com/porsager/postgres,
// README sections "Queries" and "Unsafe raw string queries").
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
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

// For tests outside src/db (they may not import the ORM): the test database, created and
// migrated, ready for the app code under test.
export async function prepareTestDatabase(): Promise<string> {
  const url = await ensureTestDatabase();
  const sql = postgres(url, { max: 1 });
  try { await migrate(drizzle(sql), { migrationsFolder: "drizzle" }); } finally { await sql.end(); }
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

// For the freeze test (stories/E6-1, acceptance 5): holds the instrument row's lock on its
// own connection, as invites.publish does, runs `during` while the saves under test wait on
// that lock, then inserts a public invite and commits. Raw SQL on a second client, so the
// test never touches the app's client (the lint rule) and the app's pool is free for the
// saves. Transactions in postgres-js: sql.begin (README, "Transactions").
export async function publishWhileLocked(workspaceId: string, instrumentId: string, during: () => Promise<void>): Promise<void> {
  const sql = postgres(testDatabaseUrl(), { max: 1 });
  try {
    await sql.begin(async (tx) => {
      await tx`select id from instrument where workspace_id = ${workspaceId} and id = ${instrumentId} for update`;
      await during();
      const token = Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      await tx`insert into invite (workspace_id, instrument_id, kind, token, closes_at) values (${workspaceId}, ${instrumentId}, 'public', ${token}, ${new Date("2026-12-01T00:00:00Z")})`;
    });
  } finally { await sql.end(); }
}
