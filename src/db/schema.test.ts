// Schema v1 acceptance (stories/E1-2-schema-v1.md, decision 0027). Runs against the test
// database (vitest.config.mts: "<database>_test", never the database DATABASE_URL named), drops
// and recreates the public and drizzle schemas there, applies the migrations twice, then checks
// the rules every later epic relies on. migrate() from drizzle-orm/postgres-js/migrator
// (node_modules/drizzle-orm/postgres-js/migrator.d.ts); the CI job also runs `npm run db:migrate`
// twice on its own database.
import { readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "./test-db";

let sql: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;
const TOKEN = "0123456789abcdef0123456789abcdef";

// Tables without workspace_id: the identity tables better-auth owns (a user exists before any
// workspace; decision 0028, accepted 2026-10-02).
const AUTH_TABLES = ["user", "session", "account", "verification"];
const APP_TABLES = ["workspace", "workspace_member", "workspace_invite", "project", "item_set", "item", "instrument", "invite", "response", "answer", "missing_item", "insight", "ai_run", "upload"];
// Columns that reference a user, not a workspace parent.
const USER_COLUMNS = ["user_id", "created_by"];

type Fk = { table_name: string; constraint_name: string; columns: string[]; ref_table: string; ref_columns: string[] };
async function foreignKeys(): Promise<Fk[]> {
  const rows = await sql`
    select c.conrelid::regclass::text as table_name, c.conname as constraint_name,
      array(select attname from pg_attribute where attrelid = c.conrelid and attnum = any(c.conkey) order by array_position(c.conkey, attnum)) as columns,
      c.confrelid::regclass::text as ref_table,
      array(select attname from pg_attribute where attrelid = c.confrelid and attnum = any(c.confkey) order by array_position(c.confkey, attnum)) as ref_columns
    from pg_constraint c join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'`;
  return rows.map((r) => ({ ...r, table_name: r.table_name.replace(/"/g, ""), ref_table: r.ref_table.replace(/"/g, "") })) as Fk[];
}

async function tableNames(): Promise<string[]> {
  const rows = await sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
  return rows.map((r) => r.table_name as string);
}

beforeAll(async () => {
  const testUrl = await ensureTestDatabase();
  sql = postgres(testUrl, { max: 1 });
  db = drizzle(sql);
  await sql.unsafe("drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;");
  await migrate(db, { migrationsFolder: "drizzle" });
}, 60_000);

afterAll(async () => { await sql.end(); });

describe("migrations", () => {
  it("create every table of docs/schema.md and nothing else", async () => {
    expect(await tableNames()).toEqual([...APP_TABLES, ...AUTH_TABLES].sort());
  });

  it("apply nothing the second time", async () => {
    const before = await sql`select count(*)::int as n, max(created_at) as last from drizzle.__drizzle_migrations`;
    await migrate(db, { migrationsFolder: "drizzle" });
    const after = await sql`select count(*)::int as n, max(created_at) as last from drizzle.__drizzle_migrations`;
    expect(after[0].n).toBe(before[0].n);
    expect(after[0].last).toBe(before[0].last);
    // One row per migration file in drizzle/, whatever the count is by now.
    expect(after[0].n).toBe(readdirSync("drizzle").filter((f) => f.endsWith(".sql")).length);
  });
});

describe("workspace scoping", () => {
  it("every application table has workspace_id with a foreign key to workspace", async () => {
    const fks = await foreignKeys();
    for (const t of APP_TABLES.filter((t) => t !== "workspace")) {
      const ok = fks.some((f) => f.table_name === t && f.columns.join() === "workspace_id" && f.ref_table === "workspace");
      expect(ok, `${t} has no workspace_id foreign key to workspace`).toBe(true);
    }
  });

  it("every parent reference is a composite key with workspace_id", async () => {
    const fks = await foreignKeys();
    const columns = await sql`select table_name, column_name from information_schema.columns where table_schema = 'public' and column_name like '%\\_id' escape '\\'`;
    const parentColumns = columns.filter((c) => APP_TABLES.includes(c.table_name) && c.column_name !== "id" && c.column_name !== "workspace_id" && !USER_COLUMNS.includes(c.column_name));
    expect(parentColumns.length).toBeGreaterThanOrEqual(11);
    // A parent column is scoped when it leads a foreign key that carries workspace_id, or when it
    // is bound to such a column by a composite key (response.item_set_id through instrument_id,
    // answer.item_set_id through response_id).
    const scoped = (t: string, col: string) => fks.some((f) => f.table_name === t && f.columns[0] === col && f.columns.includes("workspace_id") && f.ref_columns.includes("workspace_id"));
    for (const c of parentColumns) {
      const ok = scoped(c.table_name, c.column_name) || fks.some((f) => f.table_name === c.table_name && f.columns.includes(c.column_name) && f.columns.some((other) => other !== c.column_name && scoped(c.table_name, other)));
      expect(ok, `${c.table_name}.${c.column_name} has no composite foreign key with workspace_id`).toBe(true);
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
    await expect(sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind) values (${wsA}, ${responseA}, ${setA}, ${itemA}, 'maybe')`).rejects.toThrow(/answer_kind_check/);
  });

  it("refuses a child row that points at another workspace's parent", async () => {
    await expect(sql`insert into item_set (workspace_id, project_id, version, source) values (${wsB}, ${projectA}, 9, 'csv')`).rejects.toThrow(/item_set_project_fk/);
    await expect(sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsA}, ${setB}, 1, 'x')`).rejects.toThrow(/item_item_set_fk/);
    await expect(sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsA}, ${projectA}, ${setB}, 'cross')`).rejects.toThrow(/instrument_item_set_fk/);
    const [{ id: itemB }] = await sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsB}, ${setB}, 1, 'B item') returning id`;
    await expect(sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind) values (${wsA}, ${responseA}, ${setA}, ${itemB}, 'agree')`).rejects.toThrow(/answer_item_fk/);
    await expect(sql`insert into missing_item (workspace_id, response_id, text) values (${wsB}, ${responseA}, 'x')`).rejects.toThrow(/missing_item_response_fk/);
  });

  it("keeps instrument, invite, response and answer on one project and one set version", async () => {
    const [{ id: projectA2 }] = await sql`insert into project (workspace_id, name) values (${wsA}, 'P2') returning id`;
    const [{ id: setA2 }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsA}, ${projectA}, 2, 'csv') returning id`;
    const [{ id: itemA2 }] = await sql`insert into item (workspace_id, item_set_id, position, original_text) values (${wsA}, ${setA2}, 1, 'v2 item') returning id`;
    // an instrument of project P2 cannot be built on a set of project P
    await expect(sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsA}, ${projectA2}, ${setA}, 'wrong project')`).rejects.toThrow(/instrument_item_set_project_fk/);
    // a response carries the set version its instrument shows, and an invite of that instrument
    await expect(sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsA}, ${instrumentA}, ${setA2}, ${inviteA}, ${TOKEN + "e"})`).rejects.toThrow(/response_instrument_set_fk/);
    const [{ id: instrumentA2 }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${wsA}, ${projectA}, ${setA2}, 'v2') returning id`;
    const [{ id: inviteA2 }] = await sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA2}, 'public', ${TOKEN + "2"}) returning id`;
    await expect(sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsA}, ${instrumentA}, ${setA}, ${inviteA2}, ${TOKEN + "e"})`).rejects.toThrow(/response_invite_instrument_fk/);
    // an answer names an item of the response's set version
    await expect(sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind) values (${wsA}, ${responseA}, ${setA}, ${itemA2}, 'agree')`).rejects.toThrow(/answer_item_set_fk/);
    await expect(sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind) values (${wsA}, ${responseA}, ${setA2}, ${itemA2}, 'agree')`).rejects.toThrow(/answer_response_set_fk/);
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value) values (${wsA}, ${responseA}, ${setA}, ${itemA}, 'change', 'M')`;
    const [r] = await sql`select item_set_id from response where id = ${responseA}`;
    expect(r.item_set_id).toBe(setA);
  });

  it("refuses deletes under a response and refuses a project delete while responses exist", async () => {
    await expect(sql`delete from item_set where id = ${setA}`).rejects.toThrow(/violates foreign key/);
    await expect(sql`delete from invite where id = ${inviteA}`).rejects.toThrow(/response_invite/);
    await expect(sql`delete from instrument where id = ${instrumentA}`).rejects.toThrow(/response_instrument/);
    await expect(sql`delete from item where id = ${itemA}`).rejects.toThrow(/answer_item/);
    await expect(sql`delete from project where id = ${projectA}`).rejects.toThrow(/violates foreign key/);
  });

  it("requires an email on a personal invite and 32 characters in every token", async () => {
    await expect(sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA}, 'personal', ${TOKEN + "f"})`).rejects.toThrow(/invite_personal_email_check/);
    await expect(sql`insert into invite (workspace_id, instrument_id, kind, token) values (${wsA}, ${instrumentA}, 'public', 'short')`).rejects.toThrow(/invite_token_length_check/);
    await expect(sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${wsA}, ${instrumentA}, ${setA}, ${inviteA}, 'short')`).rejects.toThrow(/response_device_token_length_check/);
  });

  it("removes a workspace and everything under it, responses and answers included", async () => {
    const [{ id: ws }] = await sql`insert into workspace (name, slug) values ('Test C', 'test-c') returning id`;
    const [{ id: p }] = await sql`insert into project (workspace_id, name) values (${ws}, 'P') returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${ws}, ${p}, 1, 'pasted') returning id`;
    const [{ id: i }] = await sql`insert into item (workspace_id, item_set_id, position, original_text) values (${ws}, ${s}, 1, 'x') returning id`;
    const [{ id: ins }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title) values (${ws}, ${p}, ${s}, 'v1') returning id`;
    const [{ id: inv }] = await sql`insert into invite (workspace_id, instrument_id, kind, token, email) values (${ws}, ${ins}, 'personal', ${TOKEN + "c"}, 'c@example.com') returning id`;
    const [{ id: resp }] = await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token) values (${ws}, ${ins}, ${s}, ${inv}, ${TOKEN + "cd"}) returning id`;
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind) values (${ws}, ${resp}, ${s}, ${i}, 'agree')`;
    await sql`insert into missing_item (workspace_id, response_id, text) values (${ws}, ${resp}, 'A thing')`;
    await sql`insert into insight (workspace_id, project_id, title) values (${ws}, ${p}, 'Do this')`;
    await sql`insert into ai_run (workspace_id, project_id, purpose, model) values (${ws}, ${p}, 'shape', 'test')`;
    await sql`insert into upload (workspace_id, project_id, object_key, filename, kind, byte_size, preview) values (${ws}, ${p}, 'uploads/x/y.csv', 'list.csv', 'csv', 10, '{}')`;
    await sql`delete from workspace where id = ${ws}`;
    for (const t of APP_TABLES.filter((t) => t !== "workspace" && t !== "workspace_member")) {
      const [{ n }] = await sql.unsafe(`select count(*)::int as n from "${t}" where workspace_id = '${ws}'`);
      expect(n, `${t} still has rows of the removed workspace`).toBe(0);
    }
  });
});
