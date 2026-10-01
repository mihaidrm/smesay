// Schema v1 acceptance (stories/E1-2-schema-v1.md, decision 0027). Runs against its own test
// database, "<database>_test" on the server DATABASE_URL names, created if missing, so the
// development database is never touched. Drops and recreates that schema, applies the
// migrations twice, then checks the rules every later epic relies on. migrate() from
// drizzle-orm/postgres-js/migrator (node_modules/drizzle-orm/postgres-js/migrator.d.ts).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set; the schema tests need a Postgres to run against.");
const parsed = new URL(url);
const devDb = parsed.pathname.replace(/^\//, "");
const testDb = devDb.endsWith("_test") ? devDb : devDb + "_test";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "postgres", "db"];
if (!LOCAL_HOSTS.includes(parsed.hostname)) {
  throw new Error(`Refusing to run schema tests against ${parsed.hostname}: only a local or CI database (${LOCAL_HOSTS.join(", ")}) is allowed.`);
}
const testUrl = new URL(url); testUrl.pathname = "/" + testDb;

let sql: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;
const TOKEN = "0123456789abcdef0123456789abcdef";

// Tables without workspace_id: the identity tables better-auth owns (a user exists before any
// workspace). Pending decision; see stories/E1-2-schema-v1.md.
const AUTH_TABLES = ["user", "session", "account", "verification"];

async function tableNames(): Promise<string[]> {
  const rows = await sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
  return rows.map((r) => r.table_name as string);
}

beforeAll(async () => {
  const admin = postgres(url, { max: 1 });
  const exists = await admin`select 1 from pg_database where datname = ${testDb}`;
  if (exists.length === 0) await admin.unsafe(`create database "${testDb}"`);
  await admin.end();
  sql = postgres(testUrl.toString(), { max: 1 });
  db = drizzle(sql);
  await sql.unsafe("drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;");
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

  it("apply nothing the second time", async () => {
    const before = await sql`select count(*)::int as n, max(created_at) as last from drizzle.__drizzle_migrations`;
    await migrate(db, { migrationsFolder: "drizzle" });
    const after = await sql`select count(*)::int as n, max(created_at) as last from drizzle.__drizzle_migrations`;
    expect(after[0].n).toBe(before[0].n);
    expect(after[0].last).toBe(before[0].last);
    expect(after[0].n).toBeGreaterThan(0);
  });
});

describe("workspace scoping", () => {
  it("every application table has workspace_id with a foreign key to workspace", async () => {
    const names = (await tableNames()).filter((t) => !AUTH_TABLES.includes(t) && t !== "workspace");
    const fks = await sql`
      select tc.table_name, kcu.column_name, ccu.table_name as ref_table
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
      join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`;
    for (const t of names) {
      const ok = fks.some((f) => f.table_name === t && f.column_name === "workspace_id" && f.ref_table === "workspace");
      expect(ok, `${t} has no workspace_id foreign key to workspace`).toBe(true);
    }
  });
});

describe("rules in the database", () => {
  let wsA: string; let wsB: string; let projectA: string; let setA: string; let setB: string; let itemA: string; let instrumentA: string; let inviteA: string; let responseA: string;
  beforeAll(async () => {
    [{ id: wsA }] = await sql`insert into workspace (name, slug) values ('Test A', 'test-a') returning id`;
    [{ id: wsB }] = await sql`insert into workspace (name, slug) values ('Test B', 'test-b') returning id`;
    [{ id: projectA }] = await sql`insert into project (workspace_id, name) values (${wsA}, 'P') returning id`;
    const [{ id: projectB }] = await sql`insert into project (workspace_id, name) values (${wsB}, 'Q') returning id`;
    [{ id: setA }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsA}, ${projectA}, 1, 'csv') returning id`;
    [{ id: setB }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsB}, ${projectB}, 1, 'csv') returning id`;
    [{ id: itemA }] = await sql`insert into item (workspace_id, item_set_id, position, original_text, reader_text) values (${wsA}, ${setA}, 1, 'OCR receipt capture', 'Photograph a receipt') returning id`;
    [{ id: instrumentA }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsA}, ${projectA}, ${setA}, 'v1') returning id`;
    [{ id: inviteA }] = await sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA}, 'public', ${TOKEN}) returning id`;
    [{ id: responseA }] = await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsA}, ${instrumentA}, ${setA}, ${inviteA}, ${TOKEN + "d"}) returning id`;
  });

  it("refuses blank original text and refuses to overwrite it", async () => {
    await expect(sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsA}, ${setA}, 2, '   ')`).rejects.toThrow(/item_original_text_check/);
    await expect(sql`update item set original_text = 'rewritten' where id = ${itemA}`).rejects.toThrow(/original_text is never overwritten/);
    await sql`update item set reader_text = 'A receipt photo fills in the amount' where id = ${itemA}`;
    const [row] = await sql`select original_text, reader_text from item where id = ${itemA}`;
    expect(row.original_text).toBe("OCR receipt capture");
    expect(row.reader_text).toBe("A receipt photo fills in the amount");
  });

  it("keeps one version per project, never renumbers a version, refuses unknown enum values", async () => {
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsA}, ${projectA}, 1, 'csv')`).rejects.toThrow(/item_set_project_version_idx/);
    await expect(sql`update item_set set version = 7 where id = ${setA}`).rejects.toThrow(/version is never renumbered/);
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsA}, ${projectA}, 2, 'email')`).rejects.toThrow(/item_set_source_check/);
    await expect(sql`insert into answer (workspace_id, response_id, item_id, kind) values (${wsA}, ${responseA}, ${itemA}, 'maybe')`).rejects.toThrow(/answer_kind_check/);
  });

  it("refuses a child row that points at another workspace's parent", async () => {
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsB}, ${projectA}, 9, 'csv')`).rejects.toThrow(/item_set_project_fk/);
    await expect(sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsA}, ${setB}, 1, 'x')`).rejects.toThrow(/item_item_set_fk/);
    await expect(sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsA}, ${projectA}, ${setB}, 'cross')`).rejects.toThrow(/instrument_item_set_fk/);
    const [{ id: itemB }] = await sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsB}, ${setB}, 1, 'B item') returning id`;
    await expect(sql`insert into answer (workspace_id, response_id, item_id, kind) values (${wsA}, ${responseA}, ${itemB}, 'agree')`).rejects.toThrow(/answer_item_fk/);
    await expect(sql`insert into missing_item (workspace_id, response_id, text) values (${wsB}, ${responseA}, 'x')`).rejects.toThrow(/missing_item_response_fk/);
  });

  it("pins a response to its instrument's set version and refuses deletes under it", async () => {
    const [{ id: setA2 }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsA}, ${projectA}, 2, 'csv') returning id`;
    await expect(sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsA}, ${instrumentA}, ${setA2}, ${inviteA}, ${TOKEN + "e"})`).rejects.toThrow(/response_instrument_set_fk/);
    await expect(sql`delete from item_set where id = ${setA}`).rejects.toThrow(/violates foreign key/);
    await expect(sql`delete from invite where id = ${inviteA}`).rejects.toThrow(/response_invite_fk/);
    await expect(sql`delete from instrument where id = ${instrumentA}`).rejects.toThrow(/response_instrument_fk/);
    await sql`insert into answer (workspace_id, response_id, item_id, kind, value) values (${wsA}, ${responseA}, ${itemA}, 'change', 'M')`;
    await expect(sql`delete from item where id = ${itemA}`).rejects.toThrow(/answer_item_fk/);
    const [r] = await sql`select item_set_id from response where id = ${responseA}`;
    expect(r.item_set_id).toBe(setA);
  });

  it("requires an email on a personal invite and 32 characters in every token", async () => {
    await expect(sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA}, 'personal', ${TOKEN + "f"})`).rejects.toThrow(/invite_personal_email_check/);
    await expect(sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA}, 'public', 'short')`).rejects.toThrow(/invite_token_length_check/);
  });

  it("removes a workspace and everything under it", async () => {
    const [{ id: ws }] = await sql`insert into workspace (name, slug) values ('Test C', 'test-c') returning id`;
    const [{ id: p }] = await sql`insert into project (workspace_id, name) values (${ws}, 'P') returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${ws}, ${p}, 1, 'pasted') returning id`;
    await sql`insert into item (workspace_id, item_set_id, position, original_text) values (${ws}, ${s}, 1, 'x')`;
    await sql`delete from workspace where id = ${ws}`;
    const left = await sql`select count(*)::int as n from item where workspace_id = ${ws}`;
    expect(left[0].n).toBe(0);
  });
});
