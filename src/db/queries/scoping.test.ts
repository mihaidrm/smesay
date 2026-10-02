// The cross-workspace test (stories/E1-3, acceptance 3 and 4; CLAUDE.md: a test proves a user in
// workspace A cannot read workspace B). Two workspaces with one row in every table; every helper
// called with A's id must return nothing of B's, and B's rows must be untouched afterwards.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { db } from "@/db";
import { user } from "@/db/schema";
import { aiRuns, answers, insights, instruments, invites, itemSets, items, members, missingItems, projects, responses, workspaces } from "./index";
import { requireWorkspace } from "@/lib/workspace";
import { NotFoundError, SignedOutError } from "@/lib/errors";

const TOKEN = "0123456789abcdef0123456789abcdef";
type Rows = Record<string, string>;
type Fixture = { ws: string; userId: string; rows: Rows };
type Row = { id: string };
// What the generic check needs of a helper: the read, update and remove calls with any patch.
type Checkable = {
  list: (ws: string) => Promise<Row[]>;
  get: (ws: string, id: string) => Promise<Row | null>;
  count: (ws: string) => Promise<number>;
  update: (ws: string, id: string, patch: never) => Promise<Row | null>;
  remove: (ws: string, id: string) => Promise<Row | null>;
};

// Every scoped helper, with the patch the update check uses (an empty patch is refused by Drizzle).
const HELPERS: { name: string; helper: Checkable; patch: Record<string, unknown> }[] = [
  { name: "projects", helper: projects, patch: { name: "renamed" } },
  { name: "itemSets", helper: itemSets, patch: { sourceFilename: "other.csv" } },
  { name: "items", helper: items, patch: { readerText: "rewritten" } },
  { name: "instruments", helper: instruments, patch: { title: "renamed" } },
  { name: "invites", helper: invites, patch: { name: "renamed" } },
  { name: "responses", helper: responses, patch: { confidence: 3 } },
  { name: "answers", helper: answers, patch: { comment: "changed" } },
  { name: "missingItems", helper: missingItems, patch: { text: "changed" } },
  { name: "insights", helper: insights, patch: { title: "changed" } },
  { name: "aiRuns", helper: aiRuns, patch: { durationMs: 9 } },
];

async function fixture(label: string): Promise<Fixture> {
  const userId = "user-" + randomUUID();
  await db.insert(user).values({ id: userId, name: label, email: `${userId}@example.com` });
  const ws = (await workspaces.create({ name: "Scoping " + label, slug: "scoping-" + randomUUID() }, userId)).id;
  const rows: Rows = {};
  rows.projects = (await projects.create(ws, { name: "P " + label })).id;
  rows.itemSets = (await itemSets.create(ws, { projectId: rows.projects, version: 1, source: "csv" })).id;
  rows.items = (await items.create(ws, { itemSetId: rows.itemSets, position: 1, originalText: "Item " + label })).id;
  rows.instruments = (await instruments.create(ws, { projectId: rows.projects, itemSetId: rows.itemSets, title: "I " + label })).id;
  rows.invites = (await invites.create(ws, { instrumentId: rows.instruments, kind: "public", token: randomUUID().replace(/-/g, "") })).id;
  rows.responses = (await responses.create(ws, { instrumentId: rows.instruments, itemSetId: rows.itemSets, inviteId: rows.invites, deviceToken: randomUUID().replace(/-/g, "") })).id;
  rows.answers = (await answers.create(ws, { responseId: rows.responses, itemSetId: rows.itemSets, itemId: rows.items, kind: "agree" })).id;
  rows.missingItems = (await missingItems.create(ws, { responseId: rows.responses, text: "Missing " + label })).id;
  rows.insights = (await insights.create(ws, { projectId: rows.projects, title: "Do " + label })).id;
  rows.aiRuns = (await aiRuns.create(ws, { projectId: rows.projects, purpose: "shape", model: "test" })).id;
  return { ws, userId, rows };
}

let A: Fixture; let B: Fixture;
let sql: ReturnType<typeof postgres>;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  A = await fixture("A");
  B = await fixture("B");
}, 60_000);

afterAll(async () => {
  // Cascade removes everything under both workspaces; the users go with their rows.
  for (const f of [A, B]) {
    await sql`delete from workspace where id = ${f.ws}`;
    await sql`delete from "user" where id = ${f.userId}`;
  }
  await sql.end();
});

describe("every helper, called with A's id", () => {
  for (const h of HELPERS) {
    it(`${h.name}: lists, reads, updates, removes and counts only A's rows`, async () => {
      const aId = A.rows[h.name]; const bId = B.rows[h.name];
      expect(TOKEN.length).toBe(32);
      const before = await h.helper.get(B.ws, bId);
      expect(before).not.toBeNull();

      const listed = (await h.helper.list(A.ws)).map((r) => r.id);
      expect(listed).toContain(aId);
      expect(listed).not.toContain(bId);
      expect(await h.helper.count(A.ws)).toBe(1);

      expect(await h.helper.get(A.ws, bId)).toBeNull();
      expect(await h.helper.get(A.ws, aId)).toMatchObject({ id: aId });

      expect(await h.helper.update(A.ws, bId, h.patch as never)).toBeNull();
      expect(await h.helper.remove(A.ws, bId)).toBeNull();

      const after = await h.helper.get(B.ws, bId);
      expect(after).toEqual(before);
      expect(await h.helper.count(B.ws)).toBe(1);
    });
  }

  it("updates and removes A's own rows", async () => {
    const updated = await missingItems.update(A.ws, A.rows.missingItems, { text: "Changed by A" });
    expect(updated?.text).toBe("Changed by A");
    const removed = await missingItems.remove(A.ws, A.rows.missingItems);
    expect(removed?.id).toBe(A.rows.missingItems);
    expect(await missingItems.count(A.ws)).toBe(0);
    expect(await missingItems.count(B.ws)).toBe(1);
  });
});

describe("workspaces and membership", () => {
  it("a user sees only the workspaces they belong to", async () => {
    expect((await workspaces.listForUser(A.userId)).map((w) => w.id)).toEqual([A.ws]);
    expect(await workspaces.getForUser(A.userId, B.ws)).toBeNull();
    expect((await members.list(A.ws)).map((m) => m.userId)).toEqual([A.userId]);
    expect(await members.get(A.ws, B.userId)).toBeNull();
  });

  it("requireWorkspace returns the id for a member and 404 for anyone else", async () => {
    expect(await requireWorkspace(A.userId, A.ws)).toBe(A.ws);
    await expect(requireWorkspace(A.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspace(A.userId, randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspace(null, A.ws)).rejects.toBeInstanceOf(SignedOutError);
    await members.add(B.ws, A.userId, "member");
    expect(await requireWorkspace(A.userId, B.ws)).toBe(B.ws);
    await members.remove(B.ws, A.userId);
    await expect(requireWorkspace(A.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a deleted workspace is invisible", async () => {
    await workspaces.update(B.ws, { deletedAt: new Date() } as never);
    expect(await workspaces.getForUser(B.userId, B.ws)).toBeNull();
    await expect(requireWorkspace(B.userId, B.ws)).rejects.toBeInstanceOf(NotFoundError);
  });
});
