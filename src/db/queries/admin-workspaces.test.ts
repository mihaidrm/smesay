// The admin Workspaces pages (stories/E14-2): the list with deleted workspaces, owners and usage,
// searched by name, slug or a member's email; the reads of one workspace (instruments with their
// state, versions, uploads, events, notes); and each support action with its audit row, through
// the product's helpers so the product's rules hold. The admin check and Next's request helpers
// are stubbed (vi.mock: vitest.dev/api/vi.html#vi-mock); everything else is the real code.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { projects } from "@/db/queries";
import { usage } from "@/db/queries/usage";
import { listMembersAndInvites } from "@/lib/members";
import { adminNotes, adminWorkspace, projectVersions, workspaceDirectory, workspaceEvents, workspaceInstruments, workspaceUploads } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { workspaces } from "@/db/queries/workspaces";
import type { AdminProof } from "@/db/types";
import { instrumentState, WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { memoryOutbox } from "@/lib/mail";
import { PLANS } from "@/lib/plans";

const stamp = Date.now();
const adminId = `ws-admin-${stamp}`;
const ownerId = `ws-owner-${stamp}`;
const memberId = `ws-member-${stamp}`;
const proof = { checked: "admin", userId: adminId } as AdminProof;

// The admin check: passes, or (admin.signedIn false) refuses as notFound() does, by throwing.
const admin = vi.hoisted(() => ({ signedIn: true }));
vi.mock("@/lib/admin", () => ({
  requireAdmin: async () => {
    if (!admin.signedIn) throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
    return { session: { user: { id: adminId } }, proof };
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const actions = await import("@/app/admin/workspaces/[id]/actions");

let sql: ReturnType<typeof postgres>;
const made: string[] = [];
let wsId: string;

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const blank = { error: null, done: null };
const rows = async () => sql`select action, admin_user_id, changes, outcome from admin_audit where target_workspace_id = ${wsId} order by created_at`;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  for (const [id, email] of [[adminId, `${adminId}@example.com`], [ownerId, `owner-${stamp}@marlow.example`], [memberId, `member-${stamp}@marlow.example`]]) {
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, ${id}, ${email}, true, now(), now())`;
  }
  const w = await createWorkspaceWithSample({ name: `Kestrel ${stamp}`, slug: `kestrel-${stamp}` }, ownerId);
  wsId = w.id;
  made.push(w.id);
  await sql`insert into workspace_member (workspace_id, user_id, role) values (${wsId}, ${memberId}, 'member')`;
  // An own project with a published instrument on version 2 of its list and a public link.
  const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by) values (${wsId}, 'Expenses', ${ownerId}) returning id`;
  await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${p}, 1, 'csv')`;
  const [{ id: s2 }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${p}, 2, 'csv') returning id`;
  const [{ id: i }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title, published_at) values (${wsId}, ${p}, ${s2}, 'Round one', now()) returning id`;
  await sql`insert into invite (workspace_id, instrument_id, kind, token, closes_at) values (${wsId}, ${i}, 'public', ${("a" + stamp).padEnd(32, "0")}, now() + interval '7 days')`;
}, 60_000);

afterAll(async () => {
  await sql`delete from admin_audit where admin_user_id = ${adminId}`;
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id in (${adminId}, ${ownerId}, ${memberId})`;
  await sql.end();
});

describe("the reads", () => {
  it("lists every workspace with owners and usage, searched by name, slug or member email", async () => {
    const gone = await createWorkspaceWithSample({ name: `Gone ${stamp}`, slug: `gone-${stamp}` }, ownerId);
    made.push(gone.id);
    await sql`update workspace set deleted_at = now() where id = ${gone.id}`;
    const all = await workspaceDirectory(proof);
    const row = all.find((r) => r.id === wsId)!;
    expect(row).toMatchObject({ plan: "free", owners: [`owner-${stamp}@marlow.example`], members: 2, projects: 1, published: 1 });
    expect(all.find((r) => r.id === gone.id)?.deletedAt).not.toBeNull();
    for (let k = 1; k < all.length; k++) expect(all[k - 1].lastActivity.getTime()).toBeGreaterThanOrEqual(all[k].lastActivity.getTime());
    expect((await workspaceDirectory(proof, { q: `KESTREL ${stamp}` })).map((r) => r.id)).toEqual([wsId]);
    expect((await workspaceDirectory(proof, { q: `kestrel-${stamp}` })).map((r) => r.id)).toEqual([wsId]);
    expect((await workspaceDirectory(proof, { q: `member-${stamp}@` })).map((r) => r.id)).toEqual([wsId]);
    // % and _ are matched as themselves, not as wildcards.
    expect(await workspaceDirectory(proof, { q: "%" })).toEqual([]);
    expect(await workspaceDirectory(proof, { q: `kestrel_${stamp}` })).toEqual([]);
  });

  it("reads one workspace: instruments with state and version, uploads, events, notes", async () => {
    expect(await adminWorkspace(proof, "not-a-uuid")).toBeNull();
    expect(await adminWorkspace(proof, "00000000-0000-4000-8000-000000000000")).toBeNull();
    const found = (await adminWorkspace(proof, wsId))!;
    const list = await workspaceInstruments(proof, found.ws);
    expect(list.length).toBeGreaterThan(0);
    const published = list.find((i) => i.title === "Round one")!;
    expect(published).toMatchObject({ version: 2, personalLinks: 0 });
    expect(published.publicLink?.revokedAt).toBeNull();
    expect(instrumentState(published.publishedAt, published.publicLink)).toBe("published");
    expect((await projectVersions(proof, found.ws)).get(published.projectId)).toBe(2);
    expect(Array.isArray(await workspaceUploads(proof, found.ws))).toBe(true);
    await sql`insert into event (workspace_id, user_id, name) values (${wsId}, ${ownerId}, 'project_created')`;
    expect((await workspaceEvents(proof, found.ws, 20))[0].name).toBe("project_created");
    expect(await adminNotes.list(proof, found.ws)).toEqual([]);
  });

  it("names the plans as src/lib/plans.ts does", () => {
    expect(C.plans).toEqual(Object.fromEntries(Object.values(PLANS).map((p) => [p.key, p.name])));
  });

  it("names an instrument's state", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(instrumentState(null, null, now)).toBe("draft");
    expect(instrumentState(now, { closesAt: new Date("2026-11-01"), revokedAt: null }, now)).toBe("published");
    expect(instrumentState(now, { closesAt: new Date("2026-10-01"), revokedAt: null }, now)).toBe("closed");
    expect(instrumentState(now, { closesAt: null, revokedAt: now }, now)).toBe("revoked");
  });
});

describe("workspace A and workspace B", () => {
  it("the admin reads of A never return B's notes, instruments, uploads or events", async () => {
    const b = await createWorkspaceWithSample({ name: `Other ${stamp}`, slug: `other-${stamp}` }, ownerId);
    made.push(b.id);
    const A = (await adminWorkspace(proof, wsId))!.ws, B = (await adminWorkspace(proof, b.id))!.ws;
    await adminNotes.add(proof, B, adminId, "A note on B only.");
    const [{ id: p }] = await sql`insert into project (workspace_id, name) values (${b.id}, 'B project') returning id`;
    await sql`insert into upload (workspace_id, project_id, object_key, filename, kind, byte_size, preview) values (${b.id}, ${p}, 'uploads/x', 'b.csv', 'csv', 10, '{}'::jsonb)`;
    await sql`insert into event (workspace_id, name) values (${b.id}, 'project_created')`;
    expect((await adminNotes.list(proof, A)).map((n) => n.text)).not.toContain("A note on B only.");
    expect((await adminNotes.list(proof, B)).map((n) => n.text)).toEqual(["A note on B only."]);
    const bInstruments = new Set((await workspaceInstruments(proof, B)).map((i) => i.id));
    expect((await workspaceInstruments(proof, A)).some((i) => bInstruments.has(i.id))).toBe(false);
    expect((await workspaceUploads(proof, A)).map((u) => u.filename)).not.toContain("b.csv");
    expect((await workspaceUploads(proof, B)).map((u) => u.filename)).toEqual(["b.csv"]);
    expect((await projectVersions(proof, A)).has(p)).toBe(false);
    const aEvents = await workspaceEvents(proof, A, 100);
    expect(aEvents.length).toBeLessThan(100);
    expect((await sql`select count(*)::int as n from event where workspace_id = ${wsId}`)[0].n).toBe(aEvents.length);
  });

  it("the page's product reads with the admin's WorkspaceId show A's members, projects and usage", async () => {
    const A = (await adminWorkspace(proof, wsId))!.ws;
    expect((await listMembersAndInvites(A)).members.map((m) => m.userId).sort()).toEqual([memberId, ownerId].sort());
    expect((await projects.summaries(A)).map((x) => x.name)).toContain("Expenses");
    expect((await usage(A)).projects).toBe(1);
  });
});

describe("the actions", () => {
  it("change the plan, with its row, and refuse a bad or same plan without one", async () => {
    expect(await actions.changePlanAction(blank, form({ workspaceId: wsId, plan: "gold" }))).toEqual({ error: C.badPlan, done: null });
    expect(await actions.changePlanAction(blank, form({ workspaceId: wsId, plan: "free" }))).toEqual({ error: C.samePlan, done: null });
    expect(await actions.changePlanAction(blank, form({ workspaceId: "00000000-0000-4000-8000-000000000000", plan: "pro" }))).toEqual({ error: C.missing, done: null });
    expect(await actions.changePlanAction(blank, form({ workspaceId: wsId, plan: "team" }))).toEqual({ error: null, done: "Plan changed to Team." });
    expect((await sql`select plan from workspace where id = ${wsId}`)[0].plan).toBe("team");
    // The plan it already had is decided inside the action, so it is a refused row; the
    // malformed and missing ones above are not actions and wrote nothing.
    expect(await rows()).toEqual([
      { action: "plan_changed", admin_user_id: adminId, changes: { from: "free", to: "free" }, outcome: "refused" },
      { action: "plan_changed", admin_user_id: adminId, changes: { from: "free", to: "team" }, outcome: "done" },
    ]);
  });

  it("set the AI budget, with its row", async () => {
    expect((await actions.setBudgetAction(blank, form({ workspaceId: wsId, budget: "-1" }))).error).toBe(C.badBudget);
    expect((await actions.setBudgetAction(blank, form({ workspaceId: wsId, budget: "10001" }))).error).toBe(C.badBudget);
    expect((await actions.setBudgetAction(blank, form({ workspaceId: wsId, budget: "2.5" }))).error).toBe(C.badBudget);
    expect(await actions.setBudgetAction(blank, form({ workspaceId: wsId, budget: "25" }))).toEqual({ error: null, done: "AI budget set to EUR 25 a month." });
    expect((await sql`select ai_budget_eur from workspace where id = ${wsId}`)[0].ai_budget_eur).toBe(25);
    expect((await rows()).at(-1)).toEqual({ action: "ai_budget_set", admin_user_id: adminId, changes: { from: 10, to: 25 }, outcome: "done" });
  });

  it("send an open invitation again through the product's sender, and refuse an accepted one", async () => {
    const email = `invitee-${stamp}@marlow.example`;
    const [{ id }] = await sql`insert into workspace_invite (workspace_id, email, role, invited_by) values (${wsId}, ${email}, 'member', ${ownerId}) returning id`;
    const before = memoryOutbox.length;
    expect(await actions.resendInviteAction(blank, form({ workspaceId: wsId, inviteId: id }))).toEqual({ error: null, done: `Invitation sent again to ${email}.` });
    expect(memoryOutbox.length).toBe(before + 1);
    expect(memoryOutbox.at(-1)!.to).toBe(email);
    const [now] = await sql`select id, invited_by from workspace_invite where workspace_id = ${wsId} and email = ${email}`;
    expect(now.invited_by).toBe(ownerId);
    expect((await rows()).at(-1)).toMatchObject({ action: "invite_resent", outcome: "done" });
    // The old row was replaced, so its id is no longer open: refused, and the row says so.
    expect((await actions.resendInviteAction(blank, form({ workspaceId: wsId, inviteId: id }))).error).toBe("This invitation is no longer open. Reload the page to see the current ones.");
    expect((await rows()).at(-1)).toMatchObject({ action: "invite_resent", outcome: "refused" });
  });

  it("refuse a crafted form that names another workspace's link or invitation", async () => {
    const b = (await workspaceDirectory(proof, { q: `other-${stamp}` }))[0];
    const B = (await adminWorkspace(proof, b.id))!.ws;
    const [{ id: p }] = await sql`insert into project (workspace_id, name) values (${b.id}, 'B published') returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${b.id}, ${p}, 1, 'csv') returning id`;
    const [{ id: i }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title, published_at) values (${b.id}, ${p}, ${s}, 'B round', now()) returning id`;
    const [{ id: link }] = await sql`insert into invite (workspace_id, instrument_id, kind, token, closes_at) values (${b.id}, ${i}, 'public', ${("b" + stamp).padEnd(32, "0")}, now() + interval '7 days') returning id`;
    const [{ id: inv }] = await sql`insert into workspace_invite (workspace_id, email, role) values (${b.id}, ${`b-${stamp}@marlow.example`}, 'member') returning id`;
    const sent = memoryOutbox.length;
    // workspaceId names A, the rest are B's.
    expect((await actions.revokeLinkAction(blank, form({ workspaceId: wsId, projectId: p, instrumentId: i, inviteId: link }))).error).toBe(C.gone);
    expect((await sql`select revoked_at from invite where id = ${link}`)[0].revoked_at).toBeNull();
    expect((await rows()).at(-1)).toMatchObject({ action: "link_revoked", outcome: "refused" });
    expect((await actions.resendInviteAction(blank, form({ workspaceId: wsId, inviteId: inv }))).error).toBe("This invitation is no longer open. Reload the page to see the current ones.");
    expect(memoryOutbox.length).toBe(sent);
    // Not uuids: a malformed form, refused before any row.
    const before = (await rows()).length;
    expect((await actions.revokeLinkAction(blank, form({ workspaceId: wsId, projectId: "x", instrumentId: i, inviteId: link }))).error).toBe(C.gone);
    expect((await rows()).length).toBe(before);
    expect(B).toBe(b.id);
  });

  it("do nothing for anyone but an admin", async () => {
    admin.signedIn = false;
    try {
      const before = (await rows()).length;
      await expect(actions.changePlanAction(blank, form({ workspaceId: wsId, plan: "enterprise" }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      await expect(actions.addNoteAction(blank, form({ workspaceId: wsId, note: "x" }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      await expect(actions.restoreAction(blank, form({ workspaceId: wsId }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      expect((await rows()).length).toBe(before);
      expect((await sql`select plan from workspace where id = ${wsId}`)[0].plan).not.toBe("enterprise");
    } finally {
      admin.signedIn = true;
    }
  });

  it("revoke a public link through the kill switch", async () => {
    const found = (await adminWorkspace(proof, wsId))!;
    const i = (await workspaceInstruments(proof, found.ws)).find((x) => x.title === "Round one")!;
    const fields = { workspaceId: wsId, projectId: i.projectId, instrumentId: i.id, inviteId: i.publicLink!.id };
    expect(await actions.revokeLinkAction(blank, form(fields))).toEqual({ error: null, done: C.revoked });
    expect((await sql`select revoked_at from invite where id = ${i.publicLink!.id}`)[0].revoked_at).not.toBeNull();
    expect((await rows()).at(-1)).toMatchObject({ action: "link_revoked", outcome: "done", changes: { project: i.projectId, instrument: i.id, invite: i.publicLink!.id } });
    // Again: the product refuses (already revoked), and the row reads refused.
    expect((await actions.revokeLinkAction(blank, form(fields))).error).not.toBeNull();
    expect((await rows()).at(-1)).toMatchObject({ action: "link_revoked", outcome: "refused" });
  });

  it("restore a workspace marked deleted, and refuse a live one", async () => {
    expect((await actions.restoreAction(blank, form({ workspaceId: wsId }))).error).toBe(C.notDeleted);
    expect((await rows()).at(-1)).toMatchObject({ action: "workspace_restored", outcome: "refused" });
    await workspaces.markDeleted((await adminWorkspace(proof, wsId))!.ws, ownerId);
    // A deleted workspace keeps its plan until restored.
    expect((await actions.changePlanAction(blank, form({ workspaceId: wsId, plan: "pro" }))).error).toBe(C.deletedNoChange);
    // Nor can an invitation be sent again or a link revoked in it.
    const [{ id: inv }] = await sql`insert into workspace_invite (workspace_id, email, role) values (${wsId}, ${`late-${stamp}@marlow.example`}, 'member') returning id`;
    expect((await actions.resendInviteAction(blank, form({ workspaceId: wsId, inviteId: inv }))).error).toBe(C.deletedNoChange);
    expect(await actions.restoreAction(blank, form({ workspaceId: wsId }))).toEqual({ error: null, done: C.restored });
    expect((await sql`select deleted_at, deleted_by from workspace where id = ${wsId}`)[0]).toEqual({ deleted_at: null, deleted_by: null });
    expect((await rows()).at(-1)).toMatchObject({ action: "workspace_restored", outcome: "done" });
  });

  it("add a note, kept out of the audit row", async () => {
    expect((await actions.addNoteAction(blank, form({ workspaceId: wsId, note: "  " }))).error).toBe(C.emptyNote);
    expect((await actions.addNoteAction(blank, form({ workspaceId: wsId, note: "x".repeat(2001) }))).error).toBe(C.longNote);
    expect(await actions.addNoteAction(blank, form({ workspaceId: wsId, note: "Owner asked about the Team plan." }))).toEqual({ error: null, done: C.noted });
    const found = (await adminWorkspace(proof, wsId))!;
    expect((await adminNotes.list(proof, found.ws)).map((n) => [n.text, n.adminEmail])).toEqual([["Owner asked about the Team plan.", `${adminId}@example.com`]]);
    expect((await rows()).at(-1)).toEqual({ action: "note_added", admin_user_id: adminId, changes: { characters: 32 }, outcome: "done" });
  });
});
