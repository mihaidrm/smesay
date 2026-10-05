// The admin audit log (stories/E14-1, acceptances 3 and 4): the row is written before the action
// and by the admin the proof names; a refused row stops the action; the row ends done, refused
// or failed; changes take ids and fixed values only; the log reads newest first, 50 a page, a
// page past the end reads as the last, filters by workspace and by admin, and shows a removed
// target as null ("deleted" on the page).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { AUDIT_PAGE, audited, auditFilters, auditLog } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { workspaces } from "@/db/queries/workspaces";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { AdminAction, AdminProof } from "@/db/types";
import { AUDIT_COPY, auditChanges } from "@/lib/admin-copy";

let sql: ReturnType<typeof postgres>;
const stamp = Date.now();
const adminId = `audit-admin-${stamp}`;
const otherAdminId = `audit-admin-b-${stamp}`;
const ownerId = `audit-owner-${stamp}`;
const made: string[] = [];
const proof = { checked: "admin", userId: adminId } as AdminProof;
const otherProof = { checked: "admin", userId: otherAdminId } as AdminProof;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  for (const id of [adminId, otherAdminId, ownerId]) {
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, ${id}, ${id + "@example.com"}, true, now(), now())`;
  }
}, 60_000);

afterAll(async () => {
  await sql`delete from admin_audit where admin_user_id in (${adminId}, ${otherAdminId})`;
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id in (${adminId}, ${otherAdminId}, ${ownerId})`;
  await sql.end();
});

const newWorkspace = async (name: string) => {
  const w = await workspaces.create({ name, slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${stamp}` }, ownerId);
  made.push(w.id);
  return w;
};
const planOf = async (id: string) => (await sql`select plan from workspace where id = ${id}`)[0].plan;
const rowsFor = async (id: string) => sql`select action, admin_user_id, changes, outcome from admin_audit where target_workspace_id = ${id} order by created_at`;

describe("audited", () => {
  it("writes the row by the proof's admin, runs the action, and marks it done", async () => {
    const w = await newWorkspace("Audit Plan");
    const out = await audited(proof, { action: "plan_changed", targetWorkspaceId: w.id, changes: { from: "free", to: "pro" } }, async () => {
      // The row is in before the action runs.
      expect(await rowsFor(w.id)).toEqual([{ action: "plan_changed", admin_user_id: adminId, changes: { from: "free", to: "pro" }, outcome: null }]);
      return workspaces.setPlan(unsafeWorkspaceId(w.id), "pro");
    });
    expect(out?.plan).toBe("pro");
    expect(await planOf(w.id)).toBe("pro");
    expect(await rowsFor(w.id)).toEqual([{ action: "plan_changed", admin_user_id: adminId, changes: { from: "free", to: "pro" }, outcome: "done" }]);
  });

  it("does not run the action when its row is refused", async () => {
    const w = await newWorkspace("Audit Refused");
    let ran = false;
    const act = async () => { ran = true; return workspaces.setPlan(unsafeWorkspaceId(w.id), "team"); };
    // An action name outside the catalogue (admin_audit_action_check), a row with no target
    // (admin_audit_target_check), free text in the changes, too many keys.
    await expect(audited(proof, { action: "not_an_action" as AdminAction, targetWorkspaceId: w.id }, act)).rejects.toThrow();
    await expect(audited(proof, { action: "note_added" }, act)).rejects.toThrow();
    await expect(audited(proof, { action: "note_added", targetWorkspaceId: w.id, changes: { text: "x".repeat(81) } }, act)).rejects.toThrow("ids and fixed values only");
    await expect(audited(proof, { action: "note_added", targetWorkspaceId: w.id, changes: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`k${i}`, i])) }, act)).rejects.toThrow("ids and fixed values only");
    expect(ran).toBe(false);
    expect(await planOf(w.id)).toBe("free");
    expect(await rowsFor(w.id)).toHaveLength(0);
  });

  it("marks a refusal refused and a throw failed, and passes the error on", async () => {
    const w = await newWorkspace("Audit Outcomes");
    expect(await audited(proof, { action: "member_removed", targetWorkspaceId: w.id }, async () => ({ error: "This is the last owner." }))).toEqual({ error: "This is the last owner." });
    await expect(audited(proof, { action: "plan_changed", targetWorkspaceId: w.id }, async () => { throw new Error("refused"); })).rejects.toThrow("refused");
    expect((await rowsFor(w.id)).map((r) => r.outcome)).toEqual(["refused", "failed"]);
  });

  it("refuses to run without the admin proof", async () => {
    await expect(audited({} as AdminProof, { action: "note_added", targetWorkspaceId: made[0] }, async () => 1)).rejects.toThrow("The admin check did not run.");
  });
});

describe("auditLog", () => {
  it("reads newest first, 50 a page, filters, and shows a removed target as null", async () => {
    const a = await newWorkspace("Audit Log A");
    const b = await newWorkspace("Audit Log B");
    // 52 rows on A by the first admin, a minute apart; one on B by the second; one on a person.
    const base = Date.now() - 3_600_000;
    for (let k = 0; k < 52; k++) {
      await sql`insert into admin_audit (admin_user_id, action, target_workspace_id, changes, outcome, created_at) values (${adminId}, 'note_added', ${a.id}, ${JSON.stringify({ n: k })}::jsonb, 'done', ${new Date(base + k * 60_000).toISOString()})`;
    }
    await audited(otherProof, { action: "ai_budget_set", targetWorkspaceId: b.id, changes: { from: 10, to: 25 } }, async () => null);
    await audited(otherProof, { action: "magic_link_sent", targetUserId: ownerId }, async () => null);

    const first = await auditLog(proof, { page: 1, workspaceId: a.id });
    expect([first.total, first.page, first.rows.length]).toEqual([52, 1, AUDIT_PAGE]);
    expect(first.rows[0]).toMatchObject({ action: "note_added", outcome: "done", adminEmail: `${adminId}@example.com`, targetWorkspaceName: "Audit Log A", targetWorkspaceDeleted: false, changes: { n: 51 } });
    const second = await auditLog(proof, { page: 2, workspaceId: a.id });
    expect(second.rows.map((r) => r.changes)).toEqual([{ n: 1 }, { n: 0 }]);
    // Past the end, and absurdly far past it: the last page.
    for (const page of [5, 1e21, Number.POSITIVE_INFINITY, Number.NaN, -3]) {
      const read = await auditLog(proof, { page, workspaceId: a.id });
      expect(read.page, String(page)).toBe(Number.isNaN(page) || page < 1 ? 1 : 2);
      expect(read.rows.length).toBeGreaterThan(0);
    }

    const byAdmin = await auditLog(proof, { page: 1, adminUserId: otherAdminId });
    expect(byAdmin.total).toBe(2);
    expect(byAdmin.rows.map((r) => r.action)).toEqual(["magic_link_sent", "ai_budget_set"]);
    expect(byAdmin.rows[0]).toMatchObject({ targetWorkspaceId: null, targetUserEmail: `${ownerId}@example.com`, outcome: "done" });
    expect((await auditLog(proof, { page: 1, workspaceId: b.id, adminUserId: adminId })).total).toBe(0);
    expect((await auditLog(proof, { page: 1, workspaceId: "not-a-uuid" })).rows).toEqual([]);

    // Marked deleted: the name stays with the mark. Removed for good: the rows stay, the name
    // goes, and the filter still lists the workspace.
    await sql`update workspace set deleted_at = now() where id = ${b.id}`;
    expect((await auditLog(proof, { page: 1, workspaceId: b.id })).rows[0]).toMatchObject({ targetWorkspaceName: "Audit Log B", targetWorkspaceDeleted: true });
    await internal.hardDeleteWorkspace(b.id);
    const after = await auditLog(proof, { page: 1, adminUserId: otherAdminId });
    expect(after.rows[1]).toMatchObject({ targetWorkspaceId: b.id, targetWorkspaceName: null });

    const filters = await auditFilters(proof);
    expect(filters.workspaces.find((w) => w.id === a.id)?.name).toBe("Audit Log A");
    expect(filters.workspaces.find((w) => w.id === b.id)).toEqual({ id: b.id, name: null });
    expect(filters.admins.map((x) => x.id)).toEqual(expect.arrayContaining([adminId, otherAdminId]));
  });

  it("words every action, outcome and a row's changes", () => {
    expect(Object.keys(AUDIT_COPY.actions)).toHaveLength(12);
    expect(Object.keys(AUDIT_COPY.outcomes)).toEqual(["done", "refused", "failed", "none"]);
    expect(auditChanges({ to: "pro", from: "free", note: null })).toBe("from: free, note: none, to: pro");
    expect(AUDIT_COPY.pageOf(1, 2, 52)).toBe("Page 1 of 2, 52 actions");
    expect(AUDIT_COPY.gone("0123456789abcdef")).toBe("deleted (01234567)");
  });
});
