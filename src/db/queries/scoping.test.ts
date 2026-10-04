// The cross-workspace test (stories/E1-3, acceptance 3 and 4; CLAUDE.md: a test proves a user in
// workspace A cannot read workspace B). Two workspaces with one row in every table; every helper
// called with A's id must return nothing of B's, and every row of B must be unchanged afterwards.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { db } from "@/db";
import { user } from "@/db/schema";
import * as queries from "./index";
import { aiRuns, answers, exportLogs, insights, instruments, invites, itemSets, items, members, missingItems, projects, responses, uploads, workspaceInvites, workspaceMappings, workspaces } from "./index";
import { unsafeWorkspaceId, type WorkspaceId } from "./scoped";
import { internal, requireWorkspaceForUser } from "./internal";
import { NotFoundError, SignedOutError } from "@/lib/errors";

type Rows = Record<string, string>;
type Fixture = { ws: WorkspaceId; userId: string; rows: Rows };
type Row = { id: string };
// What the generic check needs of a helper: the read, update and remove calls with any patch.
type Checkable = {
  list: (ws: WorkspaceId) => Promise<Row[]>;
  get: (ws: WorkspaceId, id: string) => Promise<Row | null>;
  count: (ws: WorkspaceId) => Promise<number>;
  update: (ws: WorkspaceId, id: string, patch: never) => Promise<Row | null>;
  remove: (ws: WorkspaceId, id: string) => Promise<Row | null>;
};
const isCheckable = (v: unknown): v is Checkable =>
  typeof v === "object" && v !== null && ["list", "get", "count", "create", "update", "remove"].every((k) => typeof (v as Record<string, unknown>)[k] === "function");

// Every scoped helper exported from index.ts, found by shape, so a helper added later is checked
// too; the update check needs a patch per helper (an empty patch reads instead of writing).
const PATCHES: Record<string, Record<string, unknown>> = {
  projects: { name: "renamed" }, itemSets: { sourceFilename: "other.csv" }, items: { readerText: "rewritten" },
  instruments: { title: "renamed" }, invites: { name: "renamed" }, responses: { confidence: 3 }, answers: { comment: "changed" },
  missingItems: { text: "changed" }, insights: { title: "changed" }, aiRuns: { durationMs: 9 }, exportLogs: { rows: 7 }, workspaceInvites: { role: "owner" },
  uploads: { headerRow: 2 }, workspaceMappings: { headersKey: "other" },
};
const HELPERS = Object.entries(queries).filter(([, v]) => isCheckable(v)).map(([name, helper]) => ({ name, helper: helper as Checkable }));

async function fixture(label: string): Promise<Fixture> {
  const userId = "user-" + randomUUID();
  await db.insert(user).values({ id: userId, name: label, email: `${userId}@example.com` });
  const ws = unsafeWorkspaceId((await workspaces.create({ name: "Scoping " + label, slug: "scoping-" + randomUUID() }, userId)).id);
  const rows: Rows = {};
  rows.projects = (await projects.create(ws, { name: "P " + label })).id;
  rows.workspaceInvites = (await workspaceInvites.create(ws, { email: `invitee-${randomUUID()}@example.com`, invitedBy: userId })).id;
  rows.itemSets = (await itemSets.create(ws, { projectId: rows.projects, version: 1, source: "csv" })).id;
  rows.items = (await items.create(ws, { itemSetId: rows.itemSets, position: 1, originalText: "Item " + label })).id;
  rows.instruments = (await instruments.create(ws, { projectId: rows.projects, itemSetId: rows.itemSets, title: "I " + label })).id;
  rows.invites = (await invites.create(ws, { instrumentId: rows.instruments, kind: "public", token: randomUUID().replace(/-/g, "") })).id;
  rows.responses = (await responses.create(ws, { instrumentId: rows.instruments, itemSetId: rows.itemSets, inviteId: rows.invites, deviceToken: randomUUID().replace(/-/g, "") })).id;
  rows.answers = (await answers.create(ws, { responseId: rows.responses, itemSetId: rows.itemSets, itemId: rows.items, kind: "agree" })).id;
  rows.missingItems = (await missingItems.create(ws, { responseId: rows.responses, text: "Missing " + label })).id;
  rows.insights = (await insights.create(ws, { projectId: rows.projects, title: "Do " + label })).id;
  rows.aiRuns = (await aiRuns.create(ws, { projectId: rows.projects, purpose: "shape", model: "test" })).id;
  rows.exportLogs = (await exportLogs.create(ws, { projectId: rows.projects, madeBy: userId, file: "answers", rows: 3 })).id;
  rows.workspaceMappings = (await workspaceMappings.create(ws, { headersKey: "Ref\u001fRequirement", mapping: { Ref: "ref", Requirement: "text" } })).id;
  rows.uploads = (await uploads.create(ws, { projectId: rows.projects, objectKey: `uploads/${ws}/${label}.csv`, filename: "list.csv", kind: "csv", byteSize: 10, preview: { sheets: ["csv"], sheet: "csv", headerRow: 1, columns: [], rows: [], rowsRead: 0 } })).id;
  return { ws, userId, rows };
}

// Drizzle wraps a database error (DrizzleQueryError) with the Postgres error as its cause.
async function failsWith(promise: Promise<unknown>, pattern: RegExp): Promise<void> {
  let caught: unknown = null;
  try { await promise; } catch (e) { caught = e; }
  expect(caught).not.toBeNull();
  const text = String(caught) + " " + String((caught as { cause?: { message?: string } }).cause?.message ?? "");
  expect(text).toMatch(pattern);
}

// Every row of a workspace, table by table, for the before-and-after comparison.
async function snapshot(f: Fixture): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { members: await members.list(f.ws), workspace: await workspaces.getForUser(f.userId, f.ws) };
  for (const h of HELPERS) out[h.name] = await h.helper.list(f.ws);
  return out;
}

let A: Fixture; let B: Fixture;
let sql: ReturnType<typeof postgres>;
let bBefore: Record<string, unknown>;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  A = await fixture("A");
  B = await fixture("B");
  bBefore = await snapshot(B);
}, 60_000);

afterAll(async () => {
  for (const f of [A, B]) {
    await sql`delete from workspace where id = ${f.ws}`;
    await sql`delete from "user" where id = ${f.userId}`;
  }
  await sql.end();
});

describe("every scoped helper, called with A's id", () => {
  it("is in the list and has a patch", () => {
    expect(HELPERS.map((h) => h.name).sort()).toEqual(Object.keys(PATCHES).sort());
    expect(HELPERS.length).toBe(14);
  });

  for (const h of HELPERS) {
    it(`${h.name}: lists, reads, updates, removes and counts only A's rows`, async () => {
      const aId = A.rows[h.name]; const bId = B.rows[h.name];
      const listed = (await h.helper.list(A.ws)).map((r) => r.id);
      expect(listed).toContain(aId);
      expect(listed).not.toContain(bId);
      expect(await h.helper.count(A.ws)).toBe(1);
      expect(await h.helper.get(A.ws, bId)).toBeNull();
      expect(await h.helper.get(A.ws, aId)).toMatchObject({ id: aId });
      expect(await h.helper.update(A.ws, bId, PATCHES[h.name] as never)).toBeNull();
      expect(await h.helper.remove(A.ws, bId)).toBeNull();
      expect(await h.helper.get(A.ws, "not-a-uuid")).toBeNull();
      expect(await h.helper.update(A.ws, "not-a-uuid", PATCHES[h.name] as never)).toBeNull();
      expect(await h.helper.remove(A.ws, "not-a-uuid")).toBeNull();
    });
  }

  it("ignores id and workspaceId in a patch, so a row cannot be moved", async () => {
    const moved = await projects.update(A.ws, A.rows.projects, { name: "moved?", workspaceId: B.ws, id: B.rows.projects } as never);
    expect(moved).toMatchObject({ id: A.rows.projects, workspaceId: A.ws, name: "moved?" });
    expect((await projects.list(B.ws)).map((p) => p.name)).not.toContain("moved?");
    const renamed = await workspaces.update(A.ws, { name: "Scoping A renamed", id: B.ws } as never);
    expect(renamed).toMatchObject({ id: A.ws, name: "Scoping A renamed" });
  });

  it("drops keys that are not columns and refuses a non-uuid parent id", async () => {
    expect(await projects.update(A.ws, A.rows.projects, { workspace_id: B.ws, nothing: 1 } as never)).toMatchObject({ id: A.rows.projects, workspaceId: A.ws });
    await expect(itemSets.create(A.ws, { projectId: "not-a-uuid", version: 3, source: "csv" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(instruments.update(A.ws, A.rows.instruments, { itemSetId: "not-a-uuid" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("the internal helpers are not reachable through the barrel", () => {
    expect("internal" in queries).toBe(false);
    expect(typeof internal.hardDeleteWorkspace).toBe("function");
  });

  it("ignores id on create and refuses a parent from another workspace", async () => {
    const created = await projects.create(A.ws, { name: "fresh", id: B.rows.projects } as never);
    expect(created.id).not.toBe(B.rows.projects);
    expect(created.workspaceId).toBe(A.ws);
    await projects.remove(A.ws, created.id);
    await failsWith(itemSets.create(A.ws, { projectId: B.rows.projects, version: 2, source: "csv" }), /item_set_project_fk/);
    await failsWith(answers.create(A.ws, { responseId: A.rows.responses, itemSetId: B.rows.itemSets, itemId: B.rows.items, kind: "agree" }), /answer_/);
  });

  it("updates and removes A's own rows", async () => {
    const updated = await missingItems.update(A.ws, A.rows.missingItems, { text: "Changed by A" });
    expect(updated?.text).toBe("Changed by A");
    expect(await missingItems.update(A.ws, A.rows.missingItems, {})).toMatchObject({ text: "Changed by A" });
    const removed = await missingItems.remove(A.ws, A.rows.missingItems);
    expect(removed?.id).toBe(A.rows.missingItems);
    expect(await missingItems.count(A.ws)).toBe(0);
  });

  it("members: A cannot read, change or remove B's members", async () => {
    expect(await members.get(A.ws, B.userId)).toBeNull();
    expect(await members.setRole(A.ws, B.userId, "member")).toBeNull();
    expect(await members.remove(A.ws, B.userId)).toBeNull();
    expect((await members.list(A.ws)).map((m) => m.userId)).toEqual([A.userId]);
  });

  it("leaves every row of B exactly as it was", async () => {
    expect(await snapshot(B)).toEqual(bBefore);
  });
});

describe("workspaces and membership", () => {
  it("a user sees only the workspaces they belong to", async () => {
    expect((await workspaces.listForUser(A.userId)).map((w) => w.id)).toEqual([A.ws]);
    expect(await workspaces.getForUser(A.userId, B.ws)).toBeNull();
    expect(await workspaces.getForUser(A.userId, "not-a-uuid")).toBeNull();
  });

  it("requireWorkspaceForUser returns the id for a member and 404 for anyone else", async () => {
    expect(await requireWorkspaceForUser(A.userId, A.ws)).toBe(A.ws);
    await expect(requireWorkspaceForUser(A.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspaceForUser(A.userId, randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspaceForUser(A.userId, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspaceForUser(null, A.ws)).rejects.toBeInstanceOf(SignedOutError);
    await members.add(B.ws, A.userId, "member");
    expect(await requireWorkspaceForUser(A.userId, B.ws)).toBe(B.ws);
    await members.remove(B.ws, A.userId);
    await expect(requireWorkspaceForUser(A.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a deleted workspace is not handed out", async () => {
    await workspaces.markDeleted(B.ws, B.userId);
    expect(await workspaces.getForUser(B.userId, B.ws)).toBeNull();
    expect((await workspaces.listForUser(B.userId)).length).toBe(0);
    await expect(requireWorkspaceForUser(B.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
  });
});
