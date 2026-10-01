// Schema v1 acceptance (stories/E1-2-schema-v1.md, decision 0027). Runs against DATABASE_URL:
// drops and recreates the public schema, applies the migrations twice, then checks the rules
// every later epic relies on. In CI the database is a Postgres service; locally it is the
// docker compose one. migrate() from drizzle-orm/postgres-js/migrator
// (node_modules/drizzle-orm/postgres-js/migrator.d.ts).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set; the schema tests need a Postgres to run against.");
const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

// Tables without workspace_id that are reachable only through a table that has one, and the
// identity tables better-auth owns (a user exists before any workspace).
const REACHABLE: Record<string, string> = { answer: "response", missing_item: "response" };
const AUTH_TABLES = ["user", "session", "account", "verification"];

async function tableNames(): Promise<string[]> {
  const rows = await sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
  return rows.map((r) => r.table_name as string);
}

beforeAll(async () => {
  await sql.unsafe("drop schema if exists public cascade; create schema public;");
  await sql.unsafe("drop schema if exists drizzle cascade;");
  await migrate(db, { migrationsFolder: "drizzle" });
}, 60_000);

afterAll(async () => { await sql.end(); });

describe("migrations", () => {
  it("create every table of docs/schema.md", async () => {
    const names = await tableNames();
    for (const t of ["workspace", "workspace_member", "project", "item_set", "item", "instrument", "invite", "response", "answer", "missing_item", "insight", "ai_run", ...AUTH_TABLES]) {
      expect(names, t).toContain(t);
    }
  });

  it("are a no-op the second time", async () => {
    const before = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    await migrate(db, { migrationsFolder: "drizzle" });
    const after = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    expect(after[0].n).toBe(before[0].n);
    expect(after[0].n).toBeGreaterThan(0);
  });
});

describe("workspace scoping", () => {
  it("every table has workspace_id, or is reachable only through one that does", async () => {
    const names = (await tableNames()).filter((t) => !AUTH_TABLES.includes(t) && t !== "workspace");
    const cols = await sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`;
    const has = (t: string, c: string) => cols.some((r) => r.table_name === t && r.column_name === c);
    for (const t of names) {
      const scoped = has(t, "workspace_id") || (REACHABLE[t] !== undefined && has(t, REACHABLE[t] + "_id") && has(REACHABLE[t], "workspace_id"));
      expect(scoped, `${t} is not scoped to a workspace`).toBe(true);
    }
  });
});

describe("rules in the database", () => {
  let wsId: string; let projectId: string; let setId: string;
  beforeAll(async () => {
    [{ id: wsId }] = await sql`insert into workspace (name, slug) values ('Test A', 'test-a') returning id`;
    [{ id: projectId }] = await sql`insert into project (workspace_id, name) values (${wsId}, 'P') returning id`;
    [{ id: setId }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${projectId}, 1, 'csv') returning id`;
  });

  it("refuses an item with blank original text and keeps the original beside the reader text", async () => {
    await expect(sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsId}, ${setId}, 1, '   ')`).rejects.toThrow(/item_original_text_check/);
    const [row] = await sql`insert into item (workspace_id, item_set_id, position, original_text, reader_text) values (${wsId}, ${setId}, 1, 'OCR receipt capture', 'Photograph a receipt') returning original_text, reader_text`;
    expect(row.original_text).toBe("OCR receipt capture");
    expect(row.reader_text).toBe("Photograph a receipt");
    await expect(sql`update item set original_text = '' where item_set_id = ${setId}`).rejects.toThrow(/item_original_text_check/);
  });

  it("keeps one version number per project and refuses unknown enum values", async () => {
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${projectId}, 1, 'csv')`).rejects.toThrow(/item_set_project_version_idx/);
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${projectId}, 2, 'email')`).rejects.toThrow(/item_set_source_check/);
  });

  it("a response keeps pointing at the set version it was given", async () => {
    const [{ id: instrumentId }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsId}, ${projectId}, ${setId}, 'v1') returning id`;
    const [{ id: inviteId }] = await sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsId}, ${instrumentId}, 'public', 'tok-1') returning id`;
    const [{ id: responseId }] = await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsId}, ${instrumentId}, ${setId}, ${inviteId}, 'dev-1') returning id`;
    // A set version with responses cannot be removed from under them.
    await expect(sql`delete from item_set where id = ${setId}`).rejects.toThrow(/response_item_set_id_item_set_id_fk|violates foreign key/);
    const [r] = await sql`select item_set_id from response where id = ${responseId}`;
    expect(r.item_set_id).toBe(setId);
    await expect(sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsId}, ${instrumentId}, 'personal', 'tok-2')`).rejects.toThrow(/invite_personal_email_check/);
  });
});
