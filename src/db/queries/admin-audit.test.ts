// The admin audit log (stories/E14-1, acceptances 3 and 4): an action and its row commit
// together; a refused row or a failed action rolls the other back, nested transactions
// included; the log reads newest first, 50 a page, filtered by workspace and by admin, and
// shows a removed target as null ("deleted" on the page).
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
const proof = { checked: "admin" } as AdminProof;

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
const rowsFor = async (id: string) => sql`select action, admin_user_id, changes from admin_audit where target_workspace_id = ${id}`;

describe("audited", () => {
  it("writes the action and its row together", async () => {
    const w = await newWorkspace("Audit Plan");
    const out = await audited(proof, { adminUserId: adminId, action: "plan_changed", targetWorkspaceId: w.id, changes: { from: "free", to: "pro" } }, () => workspaces.setPlan(unsafeWorkspaceId(w.id), "pro"));
    expect(out?.plan).toBe("pro");
    expect(await planOf(w.id)).toBe("pro");
    expect(await rowsFor(w.id)).toEqual([{ action: "plan_changed", admin_user_id: adminId, changes: { from: "free", to: "pro" } }]);
  });

  it("rolls the action back when its row is refused", async () => {
    const w = await newWorkspace("Audit Refused");
    // An action name outside the catalogue: admin_audit_action_check refuses the row.
    await expect(audited(proof, { adminUserId: adminId, action: "not_an_action" as AdminAction, targetWorkspaceId: w.id }, () => workspaces.setPlan(unsafeWorkspaceId(w.id), "team"))).rejects.toThrow();
    expect(await planOf(w.id)).toBe("free");
    // A row with no target: admin_audit_target_check refuses it, and a nested transaction
    // (workspaces.create runs one) goes with it.
    const slug = `audit-nested-${stamp}`;
    await expect(audited(proof, { adminUserId: adminId, action: "note_added" }, () => workspaces.create({ name: "Nested", slug }, ownerId))).rejects.toThrow();
    expect(await sql`select id from workspace where slug = ${slug}`).toHaveLength(0);
    expect(await rowsFor(w.id)).toHaveLength(0);
  });

  it("writes no row when the action fails", async () => {
    const w = await newWorkspace("Audit Failed");
    await expect(audited(proof, { adminUserId: adminId, action: "plan_changed", targetWorkspaceId: w.id }, async () => {
      await workspaces.setPlan(unsafeWorkspaceId(w.id), "team");
      throw new Error("refused");
    })).rejects.toThrow("refused");
    expect(await planOf(w.id)).toBe("free");
    expect(await rowsFor(w.id)).toHaveLength(0);
  });

  it("refuses to run without the admin proof", async () => {
    await expect(audited({} as AdminProof, { adminUserId: adminId, action: "note_added", targetWorkspaceId: made[0] }, async () => 1)).rejects.toThrow("The admin check did not run.");
  });
});

describe("auditLog", () => {
  it("reads newest first, 50 a page, filters, and shows a removed target as null", async () => {
    const a = await newWorkspace("Audit Log A");
    const b = await newWorkspace("Audit Log B");
    // 52 rows on A by the first admin, a minute apart; one on B by the second; one on a person.
    const base = Date.now() - 3_600_000;
    for (let k = 0; k < 52; k++) {
      await sql`insert into admin_audit (admin_user_id, action, target_workspace_id, changes, created_at) values (${adminId}, 'note_added', ${a.id}, ${JSON.stringify({ n: k })}::jsonb, ${new Date(base + k * 60_000).toISOString()})`;
    }
    await audited(proof, { adminUserId: otherAdminId, action: "ai_budget_set", targetWorkspaceId: b.id, changes: { from: 10, to: 25 } }, async () => null);
    await audited(proof, { adminUserId: otherAdminId, action: "magic_link_sent", targetUserId: ownerId }, async () => null);

    const first = await auditLog(proof, { page: 1, workspaceId: a.id });
    expect(first.total).toBe(52);
    expect(first.rows).toHaveLength(AUDIT_PAGE);
    expect(first.rows[0].changes).toEqual({ n: 51 });
    expect(first.rows[0]).toMatchObject({ action: "note_added", adminEmail: `${adminId}@example.com`, targetWorkspaceName: "Audit Log A" });
    const second = await auditLog(proof, { page: 2, workspaceId: a.id });
    expect(second.rows.map((r) => r.changes)).toEqual([{ n: 1 }, { n: 0 }]);

    const byAdmin = await auditLog(proof, { page: 1, adminUserId: otherAdminId });
    expect(byAdmin.total).toBe(2);
    expect(byAdmin.rows.map((r) => r.action)).toEqual(["magic_link_sent", "ai_budget_set"]);
    expect(byAdmin.rows[0]).toMatchObject({ targetWorkspaceId: null, targetUserEmail: `${ownerId}@example.com` });
    expect((await auditLog(proof, { page: 1, workspaceId: b.id, adminUserId: adminId })).total).toBe(0);
    expect((await auditLog(proof, { page: 1, workspaceId: "not-a-uuid" })).rows).toEqual([]);

    const filters = await auditFilters(proof);
    expect(filters.workspaces.filter((w) => w.id === a.id || w.id === b.id).map((w) => w.name)).toEqual(["Audit Log A", "Audit Log B"]);
    expect(filters.admins.map((x) => x.id)).toEqual(expect.arrayContaining([adminId, otherAdminId]));

    // The target removed for good: its rows stay, its name goes.
    await internal.hardDeleteWorkspace(b.id);
    const after = await auditLog(proof, { page: 1, adminUserId: otherAdminId });
    expect(after.rows[1]).toMatchObject({ targetWorkspaceId: b.id, targetWorkspaceName: null });
  });

  it("words every action and a row's changes", () => {
    expect(Object.keys(AUDIT_COPY.actions)).toHaveLength(12);
    expect(auditChanges({ from: "free", to: "pro", note: null })).toBe("from: free, to: pro, note: none");
    expect(AUDIT_COPY.pageOf(1, 2, 52)).toBe("Page 1 of 2, 52 actions");
  });
});
